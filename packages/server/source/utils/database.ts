import Mongoose from "mongoose";

import { config } from "./config";

export const initDatabase = async () => {
  const { database } = await config();

  return Mongoose.connect(database.connectionUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });
};
