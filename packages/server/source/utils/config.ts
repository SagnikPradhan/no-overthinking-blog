import Joi from "joi";

import fs from "fs";
import { resolve } from "path";

import { AppError } from "./error";

export interface Config {
  web: { port: string; key: string };
  database: { connectionUri: string };
  discord: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    guildId: string;
  };
}

let cachedConfig: Config | null = null;

/**
 * Loads local `config.json` and env variales on first load,
 * then validates and returns it. Returns the cached config
 * on the subsequent calls.
 */
export async function config(): Promise<Config> {
  if (cachedConfig) return cachedConfig;

  const configSchema = Joi.object<Config>({
    web: Joi.object({
      port: Joi.string()
        .length(4)
        .default(process.env.PORT)
        .description("The port server should listen to."),

      key: Joi.string()
        .token()
        .default(process.env.WEB_KEY)
        .description("The keys used for session."),
    }),

    database: Joi.object({
      connectionUri: Joi.string()
        .uri({ scheme: "mongodb" })
        .default(process.env.DB_URI)
        .description("The database connection uri."),
    }),

    discord: Joi.object({
      clientId: Joi.string()
        .default(process.env.DISCORD_CLIENT_ID)
        .description("The discord client's id."),

      clientSecret: Joi.string()
        .default(process.env.DISCORD_CLIENT_SECRET)
        .description("The discord client's secret."),

      redirectUri: Joi.string()
        .uri()
        .default(process.env.DISCORD_REDIRECT_URI)
        .description("The redirect uri used with discord oauth."),

      guildId: Joi.string()
        .default(process.env.DISCORD_GUILD_ID)
        .description("The guild id for editors."),
    }),
  });

  const configFilePath = resolve(process.cwd(), "config.json");
  const configFileExists = fs.existsSync(configFilePath);
  const config: Partial<Config> = configFileExists
    ? await import(configFilePath)
    : {};

  const { error, value } = configSchema.validate(config, {
    presence: "required",
  });

  if (error)
    throw new AppError("Invalid Config", {
      isOperational: false,
      error,
    });

  cachedConfig = value;
  return value as Config;
}
