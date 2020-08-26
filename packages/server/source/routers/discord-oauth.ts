import { ParameterizedContext } from "koa";
import Router from "@koa/router";
import fetch from "node-fetch";

import { URLSearchParams } from "url";

import { config } from "../utils/config";
import { AppError } from "../utils/error";
import User from "../models/user";

export const router = new Router({ prefix: "/oauth/discord" });

router.get("/", async (ctx) => {
  const { discord } = await config();
  const { clientId, clientSecret, redirectUri, guildId } = discord;
  const scope = "identify email guilds";

  if (ctx.query.code)
    return loginUser(ctx, {
      discordAccessTokenGenOptions: {
        clientId,
        clientSecret,
        code: ctx.query.code,
        redirectUri,
        scope,
      },
      guildId,
    });
  else
    return redirectUser(ctx, {
      clientId,
      redirectUri,
      scope,
    });
});

/**
 * Login user when redirected by discord oauth page
 * @param ctx - Router Context
 */
async function loginUser(
  ctx: ParameterizedContext,
  {
    guildId,
    discordAccessTokenGenOptions,
  }: {
    guildId: string;
    discordAccessTokenGenOptions: DiscordAccessTokenGenOptions;
  }
) {
  const token = await generateDiscordAccessToken(discordAccessTokenGenOptions);
  const request = await discordClientRequestFactory(token);

  const userProps = [
    "id",
    "username",
    "email",
    "avatar",
    "discriminator",
  ] as const;

  const { id, username, email, avatar } = await request<
    Record<typeof userProps[number], string>
  >(
    "/users/@me",
    (data) =>
      typeof data === "object" &&
      data !== null &&
      userProps.every((key) => key in data)
  );

  const databaseUser = await User.findById(id);

  if (databaseUser === null) {
    const discordCurrentUserGuilds = await request<{ id: string }[]>(
      "/users/@me/guilds",
      (data) =>
        typeof data === "object" && data !== null && data.hasOwnProperty("id")
    );
    const isEditor = discordCurrentUserGuilds.some((g) => g.id === guildId);

    if (isEditor)
      await User.create({
        _id: id,
        username,
        email,
        avatarUrl: `https://cdn.discordapp.com/avatars/${id}/${avatar}.webp`,
        role: "editor",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
  } else ctx.session.userId = id;

  return ctx.redirect("/");
}

/**
 * Redirect user to discord oauth page
 * @param ctx - Router Context
 */
async function redirectUser(
  ctx: ParameterizedContext,
  {
    clientId,
    scope,
    redirectUri,
  }: { clientId: string; scope: string; redirectUri: string }
) {
  const query = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
    prompt: "none",
  });

  const url = `https://discord.com/api/oauth2/authorize?=${query}`;
  return ctx.redirect(url);
}

interface DiscordAccessTokenGenOptions {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  scope: string;
}

/**
 * Generate access token for client
 * @param options - Discord access token generation options
 */
async function generateDiscordAccessToken({
  clientId,
  clientSecret,
  code,
  redirectUri,
  scope,
}: DiscordAccessTokenGenOptions): Promise<string> {
  const data = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    scope: scope,
  });

  const request = await fetch("https://discord.com/api/v7/oauth2/token", {
    method: "POST",
    body: data,
  });
  if (!request.ok)
    throw new AppError("Recieved Invalid Status", {
      isOperational: true,
      request,
    });

  const response: Record<string, string> = await request.json();

  if (typeof response.access_token !== "string")
    throw new AppError("Recieved Invalid Response", {
      isOperational: true,
      response,
    });
  return response.access_token;
}

/**
 * Generates a function to request to API as user
 * @param token - Access Token
 */
function discordClientRequestFactory(token: string) {
  return async function discordAPIRequest<T>(
    endpoint: string,
    validator: (data: unknown) => boolean
  ): Promise<T> {
    const BASE = "https://discord.com/api/v7";

    const req = await fetch(BASE + endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "NOB-Client (no-url, 0.0.1)",
      },
    });

    if (!req.ok)
      throw new AppError("Invalid Status Recieved", {
        isOperational: true,
        request: req,
      });

    const res: unknown = await req.json();
    if (validator(res)) return res as T;
    else
      throw new AppError("Invalid Body Recieved", {
        isOperational: true,
        response: res,
      });
  };
}
