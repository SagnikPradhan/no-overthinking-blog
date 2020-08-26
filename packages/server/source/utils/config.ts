import "dotenv/config";
import Joi from "joi";

import { AppError } from "./error";

export interface Config {
  web: { port: string; key: string };
  database: { connectionUri: string };
  discord: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
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

  const { string } = Joi.types();
  const configSchema = Joi.object<Config>({
    web: Joi.object({
      port: string.length(4).description("The port server should listen to."),
      key: string.token().description("The keys used for session."),
    }),

    database: Joi.object({
      connectionUri: string.description("The database connection uri."),
    }),

    discord: Joi.object({
      clientId: string.description("The discord client's id."),
      clientSecret: string.description("The discord client's secret."),
      redirectUri: string
        .uri()
        .description("The redirect uri used with discord oauth."),
    }),
  });

  const env = process.env;
  const config: Config = {
    web: {
      port: env.PORT || "8080",
      key: env.WEB__KEY || "a56a4g6ag445hrhha6rh5a5eaaslapskeyboard",
    },

    database: {
      connectionUri: env.DB__URI as string,
    },

    discord: {
      clientId: env.DISCORD__CLIENT__ID as string,
      clientSecret: env.DISCORD__CLIENT__SECRET as string,
      redirectUri:
        env.DISCORD__REDIRECT__URI || "http://localhost:8080/oauth/discord",
    },
  };

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
