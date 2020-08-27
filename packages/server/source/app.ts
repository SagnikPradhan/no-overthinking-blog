import Koa from "koa";
import Session from "koa-session";
import BodyParser from "koa-bodyparser";

import { config } from "./utils/config";
import { initDatabase } from "./utils/database";
import { handleError } from "./utils/error";

import { router as discordOAuthRouter } from "./routers/oauth.discord";

export interface AppContext extends Koa.DefaultContext {
  session?: { user?: { id: string; isAdmin: boolean } } & Session.Session;
}

export const initApp = async () => {
  const { web } = await config();

  const App = new Koa<{}, AppContext>();
  App.on("error", handleError);

  App.use(Session(App));
  App.use(BodyParser());

  await initDatabase();

  App.use(discordOAuthRouter.routes());

  return App.listen(web.port, () => console.log(`Listening on ${web.port}`));
};
