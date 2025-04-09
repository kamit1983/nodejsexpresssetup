import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

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
      access_type: "online",        // only short-lived access token
      scope: SCOPES,
      state,
      include_granted_scopes: true, // optional: reuse previously granted scopes
    });
  };
  


// Handles the OAuth callback and stores tokens
export const handleOAuthCallback = async (
  code: string,
): Promise<string> => {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Failed to get access token.");
  }
  return tokens.access_token;
};

