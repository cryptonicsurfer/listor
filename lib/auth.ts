// Directus authentication library

// Allowed domains (kept for compatibility)
export const ALLOWED_DOMAINS = ["falkenberg.se", "ecoera.se"];

interface DirectusTokenData {
  access_token: string;
  expires: number; // Duration in milliseconds
  refresh_token: string;
}

interface DirectusAuthResponse {
  data: DirectusTokenData | null;
  errors?: Array<{ message: string }>;
}

interface StoredAuthDetails {
  accessToken: string;
  refreshToken: string;
  expiryTimestamp: number; // Actual timestamp (Date.now() + expires)
}

const ACCESS_TOKEN_KEY = "directus_access_token";
const REFRESH_TOKEN_KEY = "directus_refresh_token";
const EXPIRY_TIMESTAMP_KEY = "directus_expiry_timestamp";
const TOKEN_EXPIRY_BUFFER_SECONDS = 60; // Refresh token if it expires within this buffer

// --- BEGIN: In-flight refresh token management ---
let isRefreshingToken = false;
let pendingRefreshPromise: Promise<string | null> | null = null;
// --- END: In-flight refresh token management ---

export async function loginToDirectus(
  email: string,
  password: string
): Promise<DirectusAuthResponse> {
  try {
    const response = await fetch(`/api/auth/directus-proxy-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Proxied Directus login error response:", responseData);
      const errorMessage = responseData.error || `Login failed with status: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (responseData.errors) {
      throw new Error(responseData.errors[0].message || "Unknown Directus login error after proxy");
    }

    if (responseData.data && responseData.data.access_token) {
      storeAuthDetails(responseData.data);
    }
    return responseData as DirectusAuthResponse;
  } catch (error: unknown) {
    console.error("Error during proxied Directus login:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during login via proxy.";
    throw new Error(errorMessage);
  }
}

export function storeAuthDetails(tokenData: DirectusTokenData): void {
  if (typeof window !== "undefined") {
    const expiryTimestamp = Date.now() + tokenData.expires;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refresh_token);
    localStorage.setItem(EXPIRY_TIMESTAMP_KEY, expiryTimestamp.toString());
    console.log("Auth details stored. Access token expires at:", new Date(expiryTimestamp).toISOString());
  }
}

export function getAuthDetails(): StoredAuthDetails | null {
  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const expiryTimestampString = localStorage.getItem(EXPIRY_TIMESTAMP_KEY);

    if (accessToken && refreshToken && expiryTimestampString) {
      return {
        accessToken,
        refreshToken,
        expiryTimestamp: parseInt(expiryTimestampString, 10),
      };
    }
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRY_TIMESTAMP_KEY);
    console.log("All auth tokens removed.");
  }
}

async function refreshAccessToken(): Promise<DirectusTokenData | null> {
  console.log("[AUTH_LIB] refreshAccessToken: Initiating call to backend proxy (which uses HttpOnly cookie).");
  try {
    const response = await fetch('/api/auth/directus-proxy-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[AUTH_LIB] refreshAccessToken: Backend proxy call failed.", { status: response.status, body: responseData });
      if (response.status === 401 || response.status === 400) {
        console.warn("[AUTH_LIB] refreshAccessToken: Refresh token likely invalid or expired. Clearing all local tokens.");
        removeToken();
      }
      return null;
    }

    if (responseData.errors) {
        console.error("[AUTH_LIB] refreshAccessToken: Backend proxy returned Directus errors:", responseData.errors);
        return null;
    }

    console.log("[AUTH_LIB] refreshAccessToken: Backend proxy call successful. New token data received:", responseData.data);
    return responseData.data as DirectusTokenData;
  } catch (error) {
    console.error("[AUTH_LIB] refreshAccessToken: Exception during fetch or JSON parsing:", error);
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const authDetails = getAuthDetails();

  if (!authDetails) {
    console.log("No auth details found.");
    return null;
  }

  const { accessToken, refreshToken, expiryTimestamp } = authDetails;
  const currentTime = Date.now();
  const bufferMilliseconds = TOKEN_EXPIRY_BUFFER_SECONDS * 1000;

  if (expiryTimestamp > currentTime + bufferMilliseconds) {
    console.log("Access token is still valid.");
    return accessToken;
  }

  console.log("Access token expired or nearing expiry. Attempting refresh.");
  if (!refreshToken) {
    console.warn("[AUTH_LIB] No refresh token available in localStorage. Cannot refresh.");
    removeToken();
    return null;
  }

  // --- BEGIN: In-flight refresh token management ---
  if (isRefreshingToken && pendingRefreshPromise) {
    console.log("[AUTH_LIB] Refresh already in progress, returning existing promise.");
    return pendingRefreshPromise;
  }

  isRefreshingToken = true;
  pendingRefreshPromise = (async () => {
    try {
      const newTokensData = await refreshAccessToken();
      if (newTokensData) {
        storeAuthDetails(newTokensData);
        console.log("[AUTH_LIB] Token refresh successful, new access token stored.");
        return newTokensData.access_token;
      } else {
        console.error("[AUTH_LIB] Failed to refresh token. User might need to log in again.");
        return null;
      }
    } catch (error) {
      console.error("[AUTH_LIB] Exception during token refresh process:", error);
      return null;
    } finally {
      isRefreshingToken = false;
      pendingRefreshPromise = null;
      console.log("[AUTH_LIB] Refresh attempt finished, isRefreshingToken set to false.");
    }
  })();

  return pendingRefreshPromise;
  // --- END: In-flight refresh token management ---
}
