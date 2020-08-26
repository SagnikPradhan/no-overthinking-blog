import Koa from "koa";
import Session from "koa-session";
import BodyParser from "koa-bodyparser";

import { config } from "./utils/config";
import { initDatabase } from "./utils/database";

export const initApp = async () => {
  await config()

  const App = new Koa();

  App.use(Session(App));
  App.use(BodyParser());

  await initDatabase();

  return App;
};
