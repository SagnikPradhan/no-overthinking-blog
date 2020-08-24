import Mongoose from "mongoose";

import { config } from "./config";

export const initDatabase = () =>
  Mongoose.connect(config.get("database").connectionUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
