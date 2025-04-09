import express, { Request, Response } from "express";
const { getAuthUrl, handleOAuthCallback } = require("../services/gdrive-auth");


const gdriveRouter = express.Router();

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
    const access_token = await handleOAuthCallback(code);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Success</title>
      </head>
      <body>
        <script>
          window.opener.postMessage({ access_token: '${access_token}' }, 'http://localhost:5173');
          window.close();
        </script>
        <p>Authentication successful. You can close this window.</p>
      </body>
      </html>
    `);
  } catch (error) {
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

export { gdriveRouter };
