console.log("compiled");

import express, { NextFunction, Request, Response } from "express";
import { json, urlencoded } from "body-parser";

import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

declare global {
  interface CustomError extends Error {
    status?: number;
  }
}

dotenv.config({});

const app = express();
app.use(cors({}));
app.use(urlencoded({ extended: false }));
app.use(json());

//add router here

app.all("*", async (req: Request, res: Response, next: NextFunction) => {
  const error = new Error("Route not found") as CustomError;
  error.status = 404;
  next(error);
});

app.use((error: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.log("not found3", error);
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  res.status(500).json({ message: "Something went wrong!!" });
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
  } catch (error) {
    console.log("Error connecting to db");
  }
  app.listen(process.env.PORT, () => {
    console.log(`App connected to port ${process.env.PORT}`);
  });
};

start();
