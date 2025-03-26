import { NextResponse } from 'next/server';

const BASE_URL = "https://crm.businessfalkenberg.se/rest";
const COMPANIES_URL = `${BASE_URL}/companies`;

export async function GET(request: Request) {
  // Get the API token from the environment variables
  const apiToken = process.env.TWENTY_API_TOKEN;
  
  // Debug logging
  console.log('Environment token available:', !!apiToken);
  console.log('Token first 10 chars:', apiToken ? apiToken.substring(0, 10) + '...' : 'none');
  
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
  const limit = searchParams.get('limit') || '20';
  
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
    // Try approach 1: URL parameter encoding
    const params = new URLSearchParams({
      "filter": filter,
      "limit": limit.toString(),
      "order_by": "name"
    });
    
    console.log(`Fetching companies with filter: ${filter}`);
    console.log(`Using headers:`, headers);
    let response = await fetch(`${COMPANIES_URL}?${params.toString()}`, { headers });
    console.log(`Initial companies response status: ${response.status}`);
    
    if (response.status === 400) {
      // Try approach 2: Different filter format
      console.log("First approach failed, trying alternative...");
      
      // Extract the bransch value from the filter
      const branschMatch = filter.match(/\[containsAny\]:\[(.*?)\]/);
      if (branschMatch && branschMatch[1]) {
        const bransch = branschMatch[1];
        
        const alternativeUrl = `${COMPANIES_URL}?filter=bransch[eq]:${bransch}&limit=${limit}&order_by=name`;
        console.log(`Trying with URL: ${alternativeUrl}`);
        response = await fetch(alternativeUrl, { headers });
      }
    }
    
    if (response.status === 200) {
      const data = await response.json();
      return NextResponse.json(data);
    } else if (response.status === 401) {
      return NextResponse.json(
        { error: 'Authentication error with CRM API' },
        { status: 401 }
      );
    } else {
      // Try one more approach with 'in' operator
      console.log("Trying one more approach...");
      
      // Extract the bransch value from the filter
      const branschMatch = filter.match(/\[containsAny\]:\[(.*?)\]/);
      if (branschMatch && branschMatch[1]) {
        const bransch = branschMatch[1];
        
        const lastParams = new URLSearchParams({
          "filter": `bransch[in]:${bransch}`,
          "limit": limit.toString(),
          "order_by": "name"
        });
        
        response = await fetch(`${COMPANIES_URL}?${lastParams.toString()}`, { headers });
        
        if (response.status === 200) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      }
      
      // If all attempts failed
      return NextResponse.json(
        { error: `Failed to fetch companies: ${response.status}` },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}