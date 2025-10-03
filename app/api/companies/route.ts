import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.DIRECTUS_INTERNAL_URL || "https://cms.businessfalkenberg.se";

export async function GET(request: NextRequest) {
  try {
    // Get the search parameters
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const limit = searchParams.get('limit') || '20';

    if (!filter) {
      return NextResponse.json(
        { error: 'Filter parameter is required' },
        { status: 400 }
      );
    }

    // Get access token from cookie (set by login)
    const accessToken = request.cookies.get('directus_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized: No access token found' },
        { status: 401 }
      );
    }

    // Build Directus API URL for companies collection
    let directusApiUrl = `${DIRECTUS_URL}/items/companies`;

    // Build query parameters for Directus
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      sort: 'name',
    });

    // Map bransch codes to Swedish industry names in Directus
    const branschToIndustryMap: Record<string, string> = {
      'TILLVERKNING_OCH_UTVINNING': 'Tillverkning och utvinning',
      'PARTIHANDEL_OCH_NATHANDEL': 'Partihandel och näthandel',
      'INFORMATION_OCH_KOMMUNIKATION': 'Information och kommunikation',
      'BYGG_OCH_ANLAGGNING': 'Bygg och anläggning',
      'FINANS_OCH_FASTIGHETSVERKSAMHET': 'Finans och fastighetsverksamhet',
      'KULTUR_FRITID_OCH_NOJEN_SAMFUND': 'Kultur, fritid och nöjen, samfund',
      'HOTELL_OCH_RESTAURANG': 'Hotell och restaurang',
      'VARD_OCH_OMSORG': 'Vård- och omsorg',
      'AVANCERADE_FORETAGSTJANSTER': 'Avancerade företagstjänster',
      'FORETAGSTJANSTER_OCH_PERSONLIGA_TJANSTER': 'Företagstjänster och personliga tjänster',
      'TRANSPORT_OCH_LOGISTIK': 'Transport och logistik',
      'UTBILDNING': 'Utbildning',
      'JORD_OCH_SKOGSBRUK': 'Jord- och skogsbruk',
      'DETALJHANDEL_OCH_SALLANKOP': 'Detaljhandel och sällanköp'
    };

    // Parse the filter from the client (e.g., "bransch[containsAny]:[INFORMATION_OCH_KOMMUNIKATION]")
    const branschMatch = filter.match(/bransch\[containsAny\]:\[([^\]]+)\]/);
    if (branschMatch && branschMatch[1]) {
      const branschCode = branschMatch[1];
      const industryValue = branschToIndustryMap[branschCode];

      if (industryValue) {
        // Directus filter format: filter[field][operator]=value
        queryParams.append('filter[industry][_eq]', industryValue);
        console.log(`[Companies API] Filtering by industry: ${industryValue}`);
      }
    }

    directusApiUrl += `?${queryParams.toString()}`;

    console.log(`[Companies API] Fetching from Directus: ${directusApiUrl}`);

    const directusResponse = await fetch(directusApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseBody = await directusResponse.json();

    if (!directusResponse.ok) {
      console.error('[Companies API] Error from Directus:', responseBody);
      const errorMessage = responseBody?.errors?.[0]?.message || 'Failed to fetch companies from Directus';
      return NextResponse.json({ error: errorMessage, details: responseBody }, { status: directusResponse.status });
    }

    // DEBUG: Log the entire response from Directus
    console.log('[Companies API] Full Directus response:', JSON.stringify(responseBody, null, 2));

    // Transform Directus response to match expected format
    // Directus returns: { data: [...] }
    // We need: { data: { companies: [...] } }
    const transformedResponse = {
      data: {
        companies: responseBody.data || []
      }
    };

    console.log(`[Companies API] Successfully fetched ${transformedResponse.data.companies.length} companies`);
    if (transformedResponse.data.companies.length > 0) {
      console.log('[Companies API] First company sample:', JSON.stringify(transformedResponse.data.companies[0], null, 2));
    }

    return NextResponse.json(transformedResponse, { status: 200 });

  } catch (error: any) {
    console.error('[Companies API] Internal server error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
