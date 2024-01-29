import express, { Request, Response } from "express";

import path from "path";

const htmlRouter = express.Router();

htmlRouter.get("/", async (req: Request, res: Response) => {
  const filePath = path.join(__dirname, "../", "public", "index.html");
  res.sendFile(filePath);
});

export { htmlRouter };
