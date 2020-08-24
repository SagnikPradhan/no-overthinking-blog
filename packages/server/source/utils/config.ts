import Convict from "convict";
import Path from "path";

export const config = Convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  webServer: {
    port: {
      format: Number,
      default: 8080,
      env: "PORT",
      doc: "The port server should listen to.",
    },
    key: {
      format: String,
      default: "cec609c9bc601c047af917a544645c5caf8cd623312441014deb",
      env: "SERVER_KEY",
      doc: "The key used for session cookies.",
    },
  },
  database: {
    connectionUri: {
      format: String,
      default: null,
      env: "DB_URI",
      doc: "The database connection string.",
      sensitive: true,
    },
  },
}).validate({ allowed: "strict" });

if (config.get("env") === "development")
  config.loadFile(Path.resolve(process.cwd(), "config.json"));
