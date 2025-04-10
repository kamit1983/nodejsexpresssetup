import express, { Request, Response } from "express";
const { getAuthUrl, handleOAuthCallback, refreshToken } = require("../services/gdrive-auth");

const providers = new Map<string, any>();
const gdriveRouter = express.Router();

const updateProvider = (obj: Object)=>{
  const existing = providers.get('gdrive') || {};
  providers.set('gdrive', {
    ...existing,
    ...obj,
});

}
gdriveRouter.get("/auth/authurl", async (req: Request, res: Response) => {
  const userId = "123"
  const authUrl = getAuthUrl(userId, "gdrive")
  res.json({ authUrl });
});

gdriveRouter.get("/auth/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }
  try {
    const tokens = await handleOAuthCallback(code);
    tokens["refresh_expiry_date"] = Date.now() + tokens.refresh_token_expires_in * 1000;
    updateProvider({tokens});
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Success</title>
      </head>
      <body>
        <script>
          window.opener.postMessage({ access_token: '${tokens.access_token}' }, 'http://localhost:5173');
          window.close();
        </script>
        <p>Authentication successful. You can close this window.</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.log("error", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <body>
        <p>Authentication failed. Please try again.</p>
        <script>console.error(${JSON.stringify(error)})</script>
      </body>
      </html>
    `);
  }
});

gdriveRouter.get("/provider", async (req: Request, res: Response) => {
  const provider = providers.get("gdrive") || {};
  const now = Date.now();
  const ACCESS_TOKEN_REFRESH_THRESHOLD = 20 * 60 * 1000 * 10; // 20 minutes
  const REFRESH_TOKEN_REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // 1 day

  provider.API_KEY = API_KEY;
  if (
    provider.tokens?.expiry_date - now < ACCESS_TOKEN_REFRESH_THRESHOLD ||
    provider.tokens?.refresh_expiry_date - now < REFRESH_TOKEN_REFRESH_THRESHOLD
  ) {
    try {
      const newTokens = await refreshToken(provider.tokens.refresh_token, provider.tokens.refresh_token_expires_in);
      provider.tokens = {
        ...provider.tokens,
        ...newTokens,
      };
      providers.set("gdrive", provider);
      console.log("🔁 Token refreshed successfully");
    } catch (err) {
      console.error("❌ Token refresh failed", err);
      // You may want to clear the token and disable the provider here
    }
  }
  res.send(provider);
});
gdriveRouter.delete("/provider", async (req: Request, res: Response) => {
  providers.delete("gdrive");
  res.send({})
});

gdriveRouter.put("/provider", async (req: Request, res: Response) => {
  const updateObj = req.body;
  updateProvider(updateObj);
  res.send(providers.get("gdrive"));
});

export { gdriveRouter };
