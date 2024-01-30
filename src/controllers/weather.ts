import { NextFunction, Request, Response } from "express";

import Log from "../models/logs";
import Weather from "../models/weather";
import axios from "axios";
import redisClient from "../helpers/redisClient";

export const getAllWeather = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const allData = await Weather.find({});
  res.json(allData);
};

export const getWeatherByCity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const city = req.params.city.trim().toLocaleLowerCase();
  const cacheData = await redisClient.get(city);
  if (cacheData) {
    res.json(JSON.parse(cacheData));
  } else {
    let dbData = await Weather.findOne({ city: city });
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000); // Calculate the timestamp one minute ago

    const callInLastOneMinute = await Log.find({
      timeStamp: { $gte: oneMinuteAgo },
    });
    if (callInLastOneMinute.length * 2 > 100) {
      const error = new Error("Rate limited") as CustomError;
      error.status = 429;
      next(error);
    } else {
      if (!dbData) {
        const location = await axios(
          `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=c87b0dc01668b35a327c2d6d02328b9b`
        );
        const apiData = await axios(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.data[0].lat}&lon=${location.data[0].lon}&appid=c87b0dc01668b35a327c2d6d02328b9b`
        );
        await Log.create({ timeStamp: new Date() });
        const formatted = {
          city: city,
          temp: apiData.data.main.temp,
        };
        dbData = await Weather.create(formatted);
      }
      await redisClient.setEx(city, 60 * 60 * 12, JSON.stringify(dbData));
      res.json(dbData);
    }
  }
};

export const deleteWeathetById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  const deleted = await Weather.findByIdAndDelete(id);
  if (deleted) {
    res.json(deleted);
  } else {
    const error = new Error("Not found") as CustomError;
    error.status = 404;
    next(error);
  }
};
