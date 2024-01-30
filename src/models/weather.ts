import { Schema, model } from "mongoose";

const weatherSchema = new Schema({
  city: {
    type: String,
    required: true,
  },
  temp: {
    type: Number,
    required: true,
  },
});

const Weather = model("Weather", weatherSchema);

export default Weather;
