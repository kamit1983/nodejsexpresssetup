import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

// const CLIENT_ID = process.env.GDRIVE_CLIENT_ID!;
// const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET!;
// const REDIRECT_URI = process.env.GDRIVE_REDIRECT_URI!;

const REDIRECT_URI="http://localhost:3000/api/gdrive/auth/callback";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];


export const createOAuthClient = (): OAuth2Client => {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
};

// Returns an authorization URL for the user (access token only, no refresh token)
export const getAuthUrl = (userId: string, provider: string): string => {
    const oauth2Client = createOAuthClient();
    const state = `${userId}:${provider}`;
    return oauth2Client.generateAuthUrl({
      access_type: "offline",        // only short-lived access token
      prompt: "consent",
      scope: SCOPES,
      state,
      include_granted_scopes: true, // optional: reuse previously granted scopes
    });
  };
  


// Handles the OAuth callback and stores tokens
export const handleOAuthCallback = async (
  code: string,
): Promise<any> => {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Failed to get access token.");
  }
  return tokens;
};

export const refreshToken  = async (refresh_token: string, refresh_token_expires_in: number): Promise<any>=>{
  const oauth2Client = createOAuthClient();
  // Set just the refresh token
  oauth2Client.setCredentials({ refresh_token });
  try {
    const res = await oauth2Client.getAccessToken(); // Triggers refresh internally

    // Also get token expiry if needed
    const credentials = oauth2Client.credentials;

    return {
      access_token: res.token,
      expiry_date: credentials.expiry_date,
      refresh_token: credentials.refresh_token || refresh_token, // fallback to original
      refresh_expiry_date: Date.now() + refresh_token_expires_in * 1000
    };
  } catch (err) {
    console.error("Error refreshing token:", err);
    throw err;
  }

}

