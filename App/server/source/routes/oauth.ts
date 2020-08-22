import Router from "@koa/router";
import fetch from "node-fetch";

import { URLSearchParams } from "url";

import { UserModel } from '../models/user'
import { RouterContext } from '../app'

interface OAuthRouterOptions {
  endpointUrl: string;
  discord: {
    clientId: string;
    clientSecret: string;
    guildId: string;
  };
}

export const createOAuthRouter = ({
  endpointUrl,
  discord,
}: OAuthRouterOptions) => {
  const OAuthRouter = new Router<{}, RouterContext>();

  const discordRedirectURI = endpointUrl + "/login/discord";
  const discordScope = "identify email guilds";

  OAuthRouter.get("/redirect/discord", async (ctx) => {
    const redirectParams = new URLSearchParams({
      response_type: "code",
      client_id: discord.clientId,
      scope: discordScope,
      redirect_uri: discordRedirectURI,
      prompt: "none",
    }).toString();

    const redirectUrl =
      "https://discord.com/api/oauth2/authorize?" + redirectParams;
    return ctx.redirect(redirectUrl);
  });

  OAuthRouter.get("/login/discord", async (ctx) => {
    const code = ctx.query.code;
    if (typeof code !== "string") return ctx.throw(404, "Invalid Code");

    const token = await generateDiscordAccessToken({
      code,
      clientId: discord.clientId,
      clientSecret: discord.clientSecret,
      redirectURI: discordRedirectURI,
      scope: discordScope,
    });

    const discordAPIRequest = discordAPIRequestFactory(token)

    const { id, username, email, avatar } = await discordAPIRequest<{
      id: string,
      username: string,
      email: string,
      avatar: string,
      discriminator: string
    }>('/users/@me')

    const databaseUser = await UserModel.findById(id)
    if (databaseUser === null) {
      const discordCurrentUserGuilds = await discordAPIRequest<{ id: string }[]>('/users/@me/guilds')
      const isEditor = discordCurrentUserGuilds.some(g => g.id === discord.guildId)

      await UserModel.create({
        _id: id,
        username,
        email,
        avatar: `https://cdn.discordapp.com/avatars/${id}/${avatar}.webp`,
        isEditor
      })
    } else ctx.session.userId = id

    return ctx.redirect('/')
  });

  return OAuthRouter;
};

interface DiscordAccessTokenGenFnOptions {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectURI: string;
  scope: string;
}

async function generateDiscordAccessToken({
  clientId,
  clientSecret,
  code,
  redirectURI,
  scope,
}: DiscordAccessTokenGenFnOptions): Promise<string> {
  const data = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectURI,
    scope: scope,
  });

  const req = await fetch("https://discord.com/api/v7/oauth2/token", {
    method: "POST",
    body: data,
  });
  if (!req.ok) throw new Error("Recieved Invalid Status");

  const res: Record<string, string> = await req.json();

  if (typeof res.access_token !== "string")
    throw new Error("Recieved Invalid Response");
  return res.access_token;
}

function discordAPIRequestFactory(token: string) {
  return async function discordAPIRequest<T>(endpoint: string): Promise<T> {
    const BASE = "https://discord.com/api/v7";

    const req = await fetch(BASE + endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        "User-Agent": "NOB-Client (no-url, 0.0.1)",
      },
    });

    if (!req.ok) throw new Error('Invalid Status Recieved')

    const res: unknown = await req.json()
    return res as T
  }
}
