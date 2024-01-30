import { Schema, model } from "mongoose";

const logSchema = new Schema({
  timeStamp: {
    type: Date,
    required: true,
  }
});

const Log = model("Log", logSchema);

export default Log;