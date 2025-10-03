'use client'
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Copy, Mail, X } from 'lucide-react';

interface Person {
  id: string;
  name?: string; // Directus has simple string name
  title?: string; // Directus uses 'title' not 'jobTitle'
  email?: string; // Directus has simple string email
  company?: {
    id: string;
    name: string;
    industry?: string;
  };
  // For backwards compatibility with component
  companyName?: string;
  companyBransch?: string | string[];
  companyId?: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  employees?: number;
  revenue?: string;
  bransch?: string | string[];
}

const CompanyContactFinder: React.FC = () => {
  // State for selected bransch (now multi-select)
  const [selectedBransch, setSelectedBransch] = useState<string[]>([]);
  // We no longer need to store API token as it's handled by the backend
  // State for loading
  const [loading, setLoading] = useState<boolean>(false);
  // State for companies data
  const [companies, setCompanies] = useState<Company[]>([]);
  // State for people data
  const [peopleData, setPeopleData] = useState<Person[]>([]);
  // State for selected people (checkboxes)
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  // State for limit
  const [limit, setLimit] = useState<number>(20);
  // State for error
  const [error, setError] = useState<string>('');
  // State for showing companies
  const [showCompanies, setShowCompanies] = useState<boolean>(false);
  // State for copy status
  const [copyStatus, setCopyStatus] = useState<string>('');
  // State for email filter
  const [emailFilter, setEmailFilter] = useState<'all' | 'with-email' | 'without-email'>('all');

  // Bransch options with proper formatting
  const branschOptions: Record<string, string> = {
    'TILLVERKNING_OCH_UTVINNING': 'Tillverkning och utvinning',
    'PARTIHANDEL_OCH_NATHANDEL': 'Partihandel och näthandel',
    'INFORMATION_OCH_KOMMUNIKATION': 'Information och kommunikation',
    'BYGG_OCH_ANLAGGNING': 'Bygg och anläggning',
    'FINANS_OCH_FASTIGHETSVERKSAMHET': 'Finans och fastighetsverksamhet',
    'KULTUR_FRITID_OCH_NOJEN_SAMFUND': 'Kultur fritid och nöjen samfund',
    'HOTELL_OCH_RESTAURANG': 'Hotell och restaurang',
    'VARD_OCH_OMSORG': 'Vård och omsorg',
    'AVANCERADE_FORETAGSTJANSTER': 'Avancerade företagstjänster',
    'FORETAGSTJANSTER_OCH_PERSONLIGA_TJANSTER': 'Företagstjänster och personliga tjänster',
    'TRANSPORT_OCH_LOGISTIK': 'Transport och logistik',
    'UTBILDNING': 'Utbildning',
    'JORD_OCH_SKOGSBRUK': 'Jord och skogsbruk',
    'DETALJHANDEL_OCH_SALLANKOP': 'Detaljhandel och sällanköp'
  };

  // Function to extract email - Directus has simple string
  const extractEmail = (person: Person): string => {
    return person.email || "";
  };

  // Function to extract phone - not available in Directus people
  const extractPhone = (person: Person): string => {
    return ""; // Phone not available in current Directus schema
  };

  // Function to extract name - Directus has simple string
  const extractName = (person: Person): string => {
    return person.name || "";
  };

  // Function to get companies by bransch using our API route
  const getCompaniesByBransch = async (): Promise<void> => {
    if (selectedBransch.length === 0) {
      setError('Please select at least one bransch');
      return;
    }

    setError('');
    setLoading(true);
    setCompanies([]);
    setPeopleData([]);
    setSelectedPeople(new Set()); // Reset selected people

    try {
      // Fetch companies for each selected bransch
      const companiesPromises = selectedBransch.map(async (bransch) => {
        const filterParam = `bransch[containsAny]:[${bransch}]`;
        const params = new URLSearchParams({
          "filter": filterParam,
          "limit": limit.toString()
        });

        const response = await fetch(`/api/companies?${params.toString()}`);

        if (response.status === 200) {
          const data = await response.json();
          if (data.data && data.data.companies) {
            return { companies: data.data.companies, bransch };
          }
        }
        return { companies: [], bransch };
      });

      const companiesResults = await Promise.all(companiesPromises);

      // Combine all companies (removing duplicates by id)
      const allCompaniesMap = new Map<string, Company>();
      companiesResults.forEach(result => {
        result.companies.forEach((company: Company) => {
          if (!allCompaniesMap.has(company.id)) {
            allCompaniesMap.set(company.id, company);
          }
        });
      });

      const allCompanies = Array.from(allCompaniesMap.values());
      setCompanies(allCompanies);

      // Fetch people for each company with their corresponding bransch
      const peoplePromises = companiesResults.flatMap(result =>
        result.companies.map((company: Company) =>
          getPeopleByCompanyId(company.id, company.name, result.bransch)
        )
      );

      const peopleResults = await Promise.all(peoplePromises);
      const allPeople = peopleResults.flat();
      setPeopleData(allPeople);

      // Select all people by default
      const allPeopleIds = new Set(allPeople.map(p => p.id));
      setSelectedPeople(allPeopleIds);

      if (allCompanies.length === 0) {
        setError('No companies found for selected bransch(es)');
      }
    } catch (err) {
      console.error("Exception occurred:", err);
      setError(`Exception occurred: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to get people by company ID using our API route
  const getPeopleByCompanyId = async (
    companyId: string,
    companyName: string,
    companyBransch?: string | string[]
  ): Promise<Person[]> => {
    const params = new URLSearchParams({
      "filter": `companyId[eq]:${companyId}`
    });
    
    try {
      // Make the request to our API route - no need to pass API token
      const response = await fetch(`/api/people?${params.toString()}`);
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.data && data.data.people) {
          // Process and return people data with company information
          return data.data.people.map((person: Person) => ({
            ...person,
            companyName,
            companyBransch,
            companyId
          }));
        }
        return [];
      } else {
        console.log(`Error fetching people for company ${companyId}: ${response.status}`);
        return [];
      }
    } catch (err) {
      console.error(`Exception occurred while fetching people: ${err}`);
      return [];
    }
  };

  // Simple function to copy table data (only selected people)
  const copyTableData = () => {
    if (peopleData.length === 0) return;

    try {
      // Filter only selected people
      const selectedPeopleData = peopleData.filter(person => selectedPeople.has(person.id));

      if (selectedPeopleData.length === 0) {
        setCopyStatus('No people selected to copy');
        setTimeout(() => setCopyStatus(''), 3000);
        return;
      }

      // Create header row
      const headers = ['Company', 'Name', 'Title', 'Email', 'Phone', 'Bransch'];

      // Create rows for each selected person
      const rows = selectedPeopleData.map(person => {
        const branschValue = Array.isArray(person.companyBransch)
          ? person.companyBransch.map(branch => branschOptions[branch] || branch).join(', ')
          : branschOptions[person.companyBransch || ''] || person.companyBransch || '-';

        return [
          person.companyName || '',
          extractName(person),
          person.title || '',
          extractEmail(person) || '',
          extractPhone(person) || '',
          branschValue
        ].join('\t');
      });

      // Combine headers and rows
      const tableData = [headers.join('\t'), ...rows].join('\n');

      // Copy to clipboard
      navigator.clipboard.writeText(tableData);
      setCopyStatus(`Table data copied (${selectedPeopleData.length} people)!`);
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      console.error('Failed to copy table data:', err);
      setCopyStatus('Failed to copy data. Please try again.');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  // Simple function to copy email addresses (only selected people)
  const copyEmails = () => {
    if (peopleData.length === 0) return;

    try {
      // Filter only selected people
      const selectedPeopleData = peopleData.filter(person => selectedPeople.has(person.id));

      if (selectedPeopleData.length === 0) {
        setCopyStatus('No people selected to copy');
        setTimeout(() => setCopyStatus(''), 3000);
        return;
      }

      // Extract all valid email addresses from selected people
      const emails = selectedPeopleData
        .map(person => extractEmail(person))
        .filter(email => email !== '');

      // Join emails with commas for email clients
      const emailsText = emails.join(', ');

      // Copy to clipboard
      navigator.clipboard.writeText(emailsText);
      setCopyStatus(`${emails.length} email addresses copied!`);
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      console.error('Failed to copy emails:', err);
      setCopyStatus('Failed to copy emails. Please try again.');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  // Toggle individual person selection
  const togglePersonSelection = (personId: string) => {
    setSelectedPeople(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personId)) {
        newSet.delete(personId);
      } else {
        newSet.add(personId);
      }
      return newSet;
    });
  };

  // Toggle all people selection
  const toggleAllPeople = () => {
    if (selectedPeople.size === peopleData.length) {
      setSelectedPeople(new Set());
    } else {
      setSelectedPeople(new Set(peopleData.map(p => p.id)));
    }
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    getCompaniesByBransch();
  };

  // Filter people based on email filter
  const filteredPeopleData = peopleData.filter(person => {
    if (emailFilter === 'with-email') {
      return extractEmail(person) !== '';
    } else if (emailFilter === 'without-email') {
      return extractEmail(person) === '';
    }
    return true; // 'all'
  });

  // No longer needed as we're using direct table elements
  // for better scroll control

  return (
    <div className="container mx-auto pt-[200px] pb-8">
      <div className="fixed top-0 left-0 right-0 z-30 bg-background pb-6 pt-8 px-4 md:px-0 shadow-md border-b">
        <div className="container mx-auto">
          <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Company and Contact Finder</CardTitle>
          <CardDescription>Search for companies and contacts by industry sector</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-grow min-w-[200px]">
                <label className="block text-sm font-medium mb-1">Select Bransch (Multi-select)</label>
                <div className="relative">
                  <Select
                    onValueChange={(value) => {
                      if (!selectedBransch.includes(value)) {
                        const newSelection = [...selectedBransch, value];
                        setSelectedBransch(newSelection);
                        // Auto-adjust limit when multiple bransches selected
                        if (newSelection.length > 1 && limit === 20) {
                          setLimit(60);
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedBransch.length === 0 ? "Select bransch(es)" : `${selectedBransch.length} selected`} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(branschOptions).map(([value, label]) => (
                        <SelectItem key={value} value={value} disabled={selectedBransch.includes(value)}>
                          {label} {selectedBransch.includes(value) ? '✓' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBransch.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedBransch.map(branch => (
                        <Badge key={branch} variant="secondary" className="flex items-center gap-1">
                          {branschOptions[branch]}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              const newSelection = selectedBransch.filter(b => b !== branch);
                              setSelectedBransch(newSelection);
                              // Reset limit if back to single or no selection
                              if (newSelection.length <= 1 && limit === 60) {
                                setLimit(20);
                              }
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-24">
                <label className="block text-sm font-medium mb-1">Limit</label>
                <Input
                  type="number"
                  value={limit.toString()}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
                  min="1"
                />
              </div>
              
              <div className="min-w-[120px]">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
                {error}
              </div>
            )}
          </form>
        </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="h-6"></div>

      {companies.length > 0 && (
        <>
          <div className="mb-6 mt-10 flex justify-between items-center">
            <Button 
              variant={showCompanies ? "default" : "outline"}
              onClick={() => setShowCompanies(prev => !prev)}
              className="w-full py-6 text-lg font-medium"
            >
              {showCompanies ? 'Hide' : 'Show'} Companies ({companies.length})
            </Button>
          </div>

          {showCompanies && (
            <Card className="mb-12">
              <CardHeader>
                <CardTitle>Companies ({companies.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <div className="bg-background sticky top-0 z-10 border-b">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Industry</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Employees</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Revenue</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                    <table className="w-full table-fixed text-sm">
                      <tbody>
                        {companies.map((company) => (
                          <tr key={company.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium">{company.name}</td>
                            <td className="p-4 align-middle">{company.industry || '-'}</td>
                            <td className="p-4 align-middle">{company.employees || '-'}</td>
                            <td className="p-4 align-middle">{company.revenue || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {peopleData.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Contacts ({peopleData.length})</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPeople.size} selected · {filteredPeopleData.length} shown
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={emailFilter} onValueChange={(value: 'all' | 'with-email' | 'without-email') => setEmailFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by email" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All contacts</SelectItem>
                    <SelectItem value="with-email">With email</SelectItem>
                    <SelectItem value="without-email">Without email</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyTableData}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy Table ({selectedPeople.size})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyEmails}
                  className="flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  Copy Emails ({selectedPeople.size})
                </Button>
              </div>
            </div>
            {copyStatus && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                {copyStatus}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <div className="bg-background sticky top-0 z-10 border-b">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-12">
                        <Checkbox
                          checked={selectedPeople.size === filteredPeopleData.length && filteredPeopleData.length > 0}
                          onCheckedChange={() => {
                            if (selectedPeople.size === filteredPeopleData.length) {
                              // Deselect all filtered people
                              const filteredIds = new Set(filteredPeopleData.map(p => p.id));
                              setSelectedPeople(prev => new Set([...prev].filter(id => !filteredIds.has(id))));
                            } else {
                              // Select all filtered people
                              const filteredIds = filteredPeopleData.map(p => p.id);
                              setSelectedPeople(prev => new Set([...prev, ...filteredIds]));
                            }
                          }}
                        />
                      </th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Company</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Phone</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Bransch</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="max-h-[500px] overflow-y-auto overflow-x-hidden">
                <table className="w-full table-fixed text-sm">
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredPeopleData.map((person) => (
                      <tr key={person.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle w-12">
                          <Checkbox
                            checked={selectedPeople.has(person.id)}
                            onCheckedChange={() => togglePersonSelection(person.id)}
                          />
                        </td>
                        <td className="p-4 align-middle">{person.companyName}</td>
                        <td className="p-4 align-middle">{extractName(person)}</td>
                        <td className="p-4 align-middle">{person.title || '-'}</td>
                        <td className="p-4 align-middle">{extractEmail(person) || '-'}</td>
                        <td className="p-4 align-middle">{extractPhone(person) || '-'}</td>
                        <td className="p-4 align-middle">
                          {Array.isArray(person.companyBransch) ? (
                            person.companyBransch.map((branch) => (
                              <Badge key={branch} className="mr-1 mb-1">
                                {branschOptions[branch] || branch}
                              </Badge>
                            ))
                          ) : (
                            <Badge>
                              {branschOptions[person.companyBransch || ''] || person.companyBransch || '-'}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyContactFinder;