import { types as T, compat, matches } from "../deps.ts";

const { shape, boolean, string } = matches;

const current = "3.2.1.2";

export const migration: T.ExpectedExports.migration = (
  effects: T.Effects,
  version: string,
  ...args: unknown[]
) => {
  return compat.migrations.fromMapping(
    {
      "2.3.1.4": {
        up: compat.migrations.updateConfig(
          (config) => {
            const matchElectrs = shape({
              "enable-electrs": boolean,
            });
            if (!matchElectrs.test(config)) {
              config["enable-electrs"] = true;
              return config;
            }
            return config;
          },
          false,
          { version: "2.3.1.4", type: "up" }
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            // Note: the original had a trailing-space typo in the key.
            // If you want to fix that, change both lines to "enable-electrs".
            const matchElectrs = shape(
              {
                "enable-electrs ": boolean,
              },
              ["enable-electrs "]
            );
            if (matchElectrs.test(config)) {
              delete config["enable-electrs "];
              return config;
            }
            return config;
          },
          true,
          { version: "2.3.1.4", type: "down" }
        ),
      },
      "2.5.0": {
        up: compat.migrations.updateConfig(
          (config) => {
            const matchLightningType = shape({
              lightning: shape({
                type: string,
              }),
            });
            if (!matchLightningType.test(config)) {
              (config as typeof matchLightningType._TYPE).lightning.type =
                "lnd";
              return config;
            }
            return config;
          },
          false,
          { version: "2.5.0", type: "up" }
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            const matchLightningType = shape({
              lightning: shape({
                type: string?.optional(),
              }),
            });
            if (matchLightningType.test(config)) {
              if (config.lightning) {
                delete config.lightning["type"];
                return config;
              }
            }
            return config;
          },
          true,
          { version: "2.5.0", type: "down" }
        ),
      },
      "3.2.1": {
        // Migrate from the old boolean "enable-electrs" to the new union "indexer"
        up: compat.migrations.updateConfig(
          (config) => {
            const hasIndexerType =
              config?.indexer && typeof config.indexer?.type === "string";

            // Only migrate if the new union isn't already present
            if (!hasIndexerType) {
              const enabled =
                config?.["enable-electrs"] === true;

              // Create the new union field
              config.indexer = {
                type: enabled ? "electrs" : "none",
              };
            }

            // Remove legacy key if present
            if ("enable-electrs" in config) {
              delete config["enable-electrs"];
            }

            return config;
          },
          true,
          { version: "3.2.1", type: "up" }
        ),
        // Safer to prohibit downgrades from here, since the union replaces a boolean
        down: () => {
          throw new Error("Downgrades are prohibited from this version");
        },
      },
    },
    current
  )(effects, version, ...args);
};
