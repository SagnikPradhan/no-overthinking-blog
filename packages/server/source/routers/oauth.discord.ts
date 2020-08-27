import { ParameterizedContext } from "koa";
import Router from "@koa/router";
import fetch from "node-fetch";

import { URLSearchParams } from "url";

import { config } from "../utils/config";
import { AppError } from "../utils/error";
import { User, UserProps, UserType } from "../models/user";

export const router = new Router({ prefix: "/oauth/discord" });

router.get("/", async (ctx) => {
  const { discord } = await config();
  const { clientId, clientSecret, redirectUri } = discord;
  const scope = "identify email";

  if (ctx.query.code)
    return loginUser(ctx, {
      clientId,
      clientSecret,
      code: ctx.query.code,
      redirectUri,
      scope,
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
 * @param discordAccessTokenGenOptions - Options
 */
async function loginUser(
  ctx: ParameterizedContext,
  discordAccessTokenGenOptions: DiscordAccessTokenGenOptions
) {
  // Get user details from discord
  const token = await generateDiscordAccessToken(discordAccessTokenGenOptions);
  const { id, username, email, avatar } = await getUserInfo(token);

  // Find user
  const databaseUser = await User.findById(id);

  // If user not found return
  if (databaseUser === null) return;

  // Add session
  ctx.session.userId = id;

  // Update user
  Object.assign<UserType, Partial<UserProps>>(databaseUser, {
    username,
    email,
    avatar,
  });
  await databaseUser.save();

  // Redirect user
  return ctx.redirect("/");
}

/**
 * Redirect user to discord oauth page
 * @param ctx - Router Context
 * @param options - Options
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

  const url = `https://discord.com/api/oauth2/authorize?${query}`;
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
      url: request.url,
      statusCode: request.status,
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
 * Get user information from discord
 * @param token - Access Token
 */
async function getUserInfo(token: string) {
  const req = await fetch("https://discord.com/api/v7/users/@me", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "NOB-Client (no-url, 0.0.1)",
    },
  });

  if (!req.ok)
    throw new AppError("Invalid Status Recieved", {
      isOperational: true,
      url: req.url,
      statusCode: req.status,
    });

  const res: Record<string, unknown> = await req.json();
  const userProps = ["id", "username", "email", "avatar"] as const;

  if (
    typeof res === "object" &&
    res !== null &&
    userProps.every((key) => typeof res[key] === "string")
  )
    return res as Record<typeof userProps[number], string>;
  else
    throw new AppError("Invalid Body Recieved", {
      isOperational: true,
      response: res,
    });
}
