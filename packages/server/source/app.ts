import Koa from "koa";
import Session from "koa-session";
import BodyParser from "koa-bodyparser";

import { config } from "./utils/config";
import { initDatabase } from "./utils/database";
import { router as discordOAuthRouter } from "./routers/oauth.discord";
import { handleError } from './utils/error';

export const initApp = async () => {
  const { web } = await config();

  const App = new Koa();
  App.on("error", handleError)

  App.use(Session(App));
  App.use(BodyParser());

  await initDatabase();

  App.use(discordOAuthRouter.routes());

  return App.listen(web.port, () => console.log(`Listening on ${web.port}`));
};
