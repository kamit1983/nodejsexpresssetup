import { deleteWeathetById, getAllWeather, getWeatherByCity } from "../controllers/weather";

import { Router } from "express";

const router = Router();

router.get("/weathers", getAllWeather);
router.delete("/weather/:id", deleteWeathetById);
router.get("/weather/:city", getWeatherByCity);

export {router as weatherRouter}