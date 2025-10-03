import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.DIRECTUS_INTERNAL_URL || "https://cms.businessfalkenberg.se";

export async function GET(request: NextRequest) {
  try {
    // Get the search parameters
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const limit = searchParams.get('limit') || '60';

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

    // Build Directus API URL for people collection
    let directusApiUrl = `${DIRECTUS_URL}/items/people`;

    // Build query parameters for Directus
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      // Request specific fields to include in response
      // Note: Based on CRM app types, people have: name, title, email, company (relation)
      fields: 'id,name,title,email,company.id,company.name,company.industry',
    });

    // Parse the filter from the client (e.g., "companyId[eq]:123")
    const companyIdMatch = filter.match(/companyId\[eq\]:([^&]+)/);
    if (companyIdMatch && companyIdMatch[1]) {
      const companyId = companyIdMatch[1];
      // Directus filter format: filter[field][operator]=value
      // The field in Directus is called "company", not "companyId"
      queryParams.append('filter[company][_eq]', companyId);
    }

    directusApiUrl += `?${queryParams.toString()}`;

    console.log(`[People API] Fetching from Directus: ${directusApiUrl}`);

    const directusResponse = await fetch(directusApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseBody = await directusResponse.json();

    if (!directusResponse.ok) {
      console.error('[People API] Error from Directus:', responseBody);
      const errorMessage = responseBody?.errors?.[0]?.message || 'Failed to fetch people from Directus';
      return NextResponse.json({ error: errorMessage, details: responseBody }, { status: directusResponse.status });
    }

    // Transform Directus response to match expected format
    // Directus returns: { data: [...] }
    // We need: { data: { people: [...] } }
    const transformedResponse = {
      data: {
        people: responseBody.data || []
      }
    };

    console.log(`[People API] Successfully fetched ${transformedResponse.data.people.length} people`);

    return NextResponse.json(transformedResponse, { status: 200 });

  } catch (error: any) {
    console.error('[People API] Internal server error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
