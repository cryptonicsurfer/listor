import { NextResponse } from 'next/server';

const BASE_URL = "https://crm.businessfalkenberg.se/rest";
const PEOPLE_URL = `${BASE_URL}/people`;

export async function GET(request: Request) {
  // Get the API token from the environment variables
  const apiToken = process.env.TWENTY_API_TOKEN;
  
  // Debug logging
  console.log('People API - Environment token available:', !!apiToken);
  console.log('People API - Token first 10 chars:', apiToken ? apiToken.substring(0, 10) + '...' : 'none');
  
  // Check if token exists
  if (!apiToken) {
    return NextResponse.json(
      { error: 'API token is not configured on the server' },
      { status: 401 }
    );
  }

  // Get the search parameters
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');
  const limit = searchParams.get('limit') || '60';
  
  if (!filter) {
    return NextResponse.json(
      { error: 'Filter parameter is required' },
      { status: 400 }
    );
  }

  const headers = {
    "Authorization": `Bearer ${apiToken}`,
    "Accept": "application/json"
  };

  try {
    const params = new URLSearchParams({
      "filter": filter,
      "limit": limit.toString()
    });
    
    console.log(`Making people API request with params: ${params}`);
    let response = await fetch(`${PEOPLE_URL}?${params.toString()}`, { headers });
    
    if (response.status === 200) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // Try alternate approach without any parameters except filter
      console.log("Trying simplified approach...");
      const simpleParams = new URLSearchParams({
        "filter": filter
      });
      
      response = await fetch(`${PEOPLE_URL}?${simpleParams.toString()}`, { headers });
      
      if (response.status === 200) {
        const data = await response.json();
        return NextResponse.json(data);
      } else {
        return NextResponse.json(
          { error: `Failed to fetch people: ${response.status}` },
          { status: response.status }
        );
      }
    }
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}