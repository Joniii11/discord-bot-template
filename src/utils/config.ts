import dotenv from "dotenv";

dotenv.config();

const envKeys = ["TOKEN", "USE_SHARDING", "SHOW_DEBUG", "PREFIX", "OWNER_IDS"] as const;
const { TOKEN, USE_SHARDING, SHOW_DEBUG, PREFIX, OWNER_IDS } = getSanitzedConfig(getEnvConfig());

export default {
    token: TOKEN,
    useSharding: parseBoolean(USE_SHARDING),
    showDebug: Boolean(SHOW_DEBUG),
    prefix: PREFIX,
    ownerIds: parseArray(OWNER_IDS)
};

function parseArray(value: string | string[] | undefined) {
  if (!value) return [];

  if (typeof value === "string") {
    value = value.split(",").map((v) => v.trim());
  }

  return value;
}

function parseBoolean(value: string | boolean | undefined) {
  if (!value) return false;

  if (typeof value === "string") {
    value = value.trim().toLowerCase();
  }

  switch (value) {
    case true:
      return true;

    case "true":
      return true;

    default:
      return false;
  }
};

type EnvKeys = typeof envKeys[number];
type ENV = { [key in EnvKeys]?: string | undefined };
type SanitizedConfig = { [key in EnvKeys]: string };

/**
 * This function gets the env and returns the specific things
 * @returns
 */
export function getEnvConfig(): ENV {
  return envKeys.reduce((acc, current) => {
      acc[current] = process.env[current];
      return acc;
  }, {} as ENV);
}
/**
* This function returns every .env type that was specified. It gives it a proper Type and so much more.
* @param config   The config that should check it trough
* @returns
*/
export function getSanitzedConfig(configEnv: ENV): SanitizedConfig {
  for (const [key, value] of Object.entries(configEnv)) {
      if (!value) {
          throw new Error(`Missing key ${key} in .env`);
      }
  };

  return configEnv as SanitizedConfig;
};
  