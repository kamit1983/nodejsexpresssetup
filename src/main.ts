console.log("compiled");

import express, { NextFunction, Request, Response } from "express";
import { json, urlencoded } from "body-parser";

import cors from "cors";
import dotenv from "dotenv";
import { htmlRouter } from "./routers/html";
import mongoose from "mongoose";
import { weatherRouter } from "./routers/weather";

const path = require('path');

dotenv.config({});

const app = express();
app.use(cors({}));
app.use(urlencoded({ extended: false }));
app.use(json());

//add router here
app.use('/', htmlRouter);
app.use("/api", weatherRouter);

app.all("*", async (req: Request, res: Response, next: NextFunction) => {
  const error = new Error("Route not found") as CustomError;
  error.status = 404;
  next(error);
});

app.use(
  (error: CustomError, req: Request, res: Response, next: NextFunction) => {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Something went wrong!!" });
  }
);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Mongo Db");
  } catch (error) {
    console.log("Error connecting to db");
  }
  app.listen(process.env.PORT, () => {
    console.log(`App connected to port ${process.env.PORT}`);
  });
};

start();
