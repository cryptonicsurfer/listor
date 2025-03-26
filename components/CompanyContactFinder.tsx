'use client'
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Copy, Mail } from 'lucide-react';

interface Person {
  id: string;
  name: {
    firstName?: string;
    lastName?: string;
  };
  emails?: {
    primaryEmail?: string;
    list?: Array<{
      email?: string;
    }>;
  };
  phones?: {
    primaryPhone?: string;
    list?: Array<{
      phone?: string;
    }>;
  };
  jobTitle?: string;
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
  // State for selected bransch
  const [selectedBransch, setSelectedBransch] = useState<string>('');
  // We no longer need to store API token as it's handled by the backend
  // State for loading
  const [loading, setLoading] = useState<boolean>(false);
  // State for companies data
  const [companies, setCompanies] = useState<Company[]>([]);
  // State for people data
  const [peopleData, setPeopleData] = useState<Person[]>([]);
  // State for limit
  const [limit, setLimit] = useState<number>(20);
  // State for error
  const [error, setError] = useState<string>('');
  // State for showing companies
  const [showCompanies, setShowCompanies] = useState<boolean>(false);
  // State for copy status
  const [copyStatus, setCopyStatus] = useState<string>('');

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

  // Function to extract email from emails object
  const extractEmail = (emails?: Person['emails']): string => {
    if (!emails || typeof emails !== 'object') {
      return "";
    }
    
    const primaryEmail = emails.primaryEmail;
    if (primaryEmail) {
      return primaryEmail;
    }
    
    const emailList = emails.list;
    if (emailList && emailList.length > 0) {
      return emailList[0].email || "";
    }
    
    return "";
  };

  // Function to extract phone from phones object
  const extractPhone = (phones?: Person['phones']): string => {
    if (!phones || typeof phones !== 'object') {
      return "";
    }
    
    const primaryPhone = phones.primaryPhone;
    if (primaryPhone) {
      return primaryPhone;
    }
    
    const phoneList = phones.list;
    if (phoneList && phoneList.length > 0) {
      return phoneList[0].phone || "";
    }
    
    return "";
  };

  // Function to extract name from name object
  const extractName = (nameObj?: Person['name']): string => {
    if (!nameObj || typeof nameObj !== 'object') {
      return "";
    }
    
    const firstName = nameObj.firstName || "";
    const lastName = nameObj.lastName || "";
    
    return `${firstName} ${lastName}`.trim();
  };

  // Function to get companies by bransch using our API route
  const getCompaniesByBransch = async (): Promise<void> => {
    if (!selectedBransch) {
      setError('Please select a bransch');
      return;
    }

    setError('');
    setLoading(true);
    setCompanies([]);
    setPeopleData([]);

  // Filter parameter for bransch
  const filterParam = `bransch[containsAny]:[${selectedBransch}]`;

  try {
    // Using our Next.js API route
    const params = new URLSearchParams({
      "filter": filterParam,
      "limit": limit.toString()
    });
    
    // Make the request to our API route - no need to pass API token
    const response = await fetch(`/api/companies?${params.toString()}`)
    
    if (response.status === 200) {
      const data = await response.json();
      if (data.data && data.data.companies) {
        setCompanies(data.data.companies);
        
        // Fetch people for each company
        const peoplePromises = data.data.companies.map((company: Company) => 
          getPeopleByCompanyId(company.id, company.name, company.bransch)
        );
        
        const peopleResults = await Promise.all(peoplePromises);
        const allPeople = peopleResults.flat();
        setPeopleData(allPeople);
      } else {
        setError('No companies found or unexpected API response format');
      }
    } else {
      const errorData = await response.json();
      setError(errorData.error || `Error: ${response.status}`);
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

  // Simple function to copy table data
  const copyTableData = () => {
    if (peopleData.length === 0) return;
    
    try {
      // Create header row
      const headers = ['Company', 'Name', 'Title', 'Email', 'Phone', 'Bransch'];
      
      // Create rows for each person
      const rows = peopleData.map(person => {
        const branschValue = Array.isArray(person.companyBransch) 
          ? person.companyBransch.map(branch => branschOptions[branch] || branch).join(', ')
          : branschOptions[person.companyBransch || ''] || person.companyBransch || '-';
        
        return [
          person.companyName || '',
          extractName(person.name),
          person.jobTitle || '',
          extractEmail(person.emails) || '',
          extractPhone(person.phones) || '',
          branschValue
        ].join('\t');
      });

      // Combine headers and rows
      const tableData = [headers.join('\t'), ...rows].join('\n');
      
      // Copy to clipboard
      navigator.clipboard.writeText(tableData);
      setCopyStatus('Table data copied to clipboard!');
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      console.error('Failed to copy table data:', err);
      setCopyStatus('Failed to copy data. Please try again.');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  // Simple function to copy email addresses
  const copyEmails = () => {
    if (peopleData.length === 0) return;
    
    try {
      // Extract all valid email addresses
      const emails = peopleData
        .map(person => extractEmail(person.emails))
        .filter(email => email !== '');
      
      // Join emails with commas for email clients
      const emailsText = emails.join(', ');
      
      // Copy to clipboard
      navigator.clipboard.writeText(emailsText);
      setCopyStatus('Email addresses copied to clipboard!');
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      console.error('Failed to copy emails:', err);
      setCopyStatus('Failed to copy emails. Please try again.');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    getCompaniesByBransch();
  };

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
                <label className="block text-sm font-medium mb-1">Select Bransch</label>
                <Select value={selectedBransch} onValueChange={setSelectedBransch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bransch" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(branschOptions).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <CardTitle>Contacts ({peopleData.length})</CardTitle>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={copyTableData}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy Table
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={copyEmails}
                  className="flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  Copy Emails
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
                    {peopleData.map((person) => (
                      <tr key={person.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">{person.companyName}</td>
                        <td className="p-4 align-middle">{extractName(person.name)}</td>
                        <td className="p-4 align-middle">{person.jobTitle || '-'}</td>
                        <td className="p-4 align-middle">{extractEmail(person.emails) || '-'}</td>
                        <td className="p-4 align-middle">{extractPhone(person.phones) || '-'}</td>
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