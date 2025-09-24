import { compat, types as T } from "../deps.ts";

// Extend the config type with the fields we use from getConfig
interface CustomConfig extends T.Config {
  lightning?: {
    type?: "none" | "lnd" | "cln";
  };
  indexer?: {
    type?: "electrs" | "fulcrum" | "none";
  };
  // Legacy support (pre-migration): old boolean flag
  "enable-electrs"?: boolean;
}

// deno-lint-ignore require-await
export const setConfig: T.ExpectedExports.setConfig = async (
  effects: T.Effects,
  newConfig: CustomConfig
) => {
  // Backward-compat shim:
  // If someone still has a saved config with "enable-electrs",
  // treat true => electrs, false/undefined => none,
  // unless the new union is present (which takes precedence).
  const legacyEnableElectrs = newConfig?.["enable-electrs"];
  const indexerType: "electrs" | "fulcrum" | "none" =
    newConfig?.indexer?.type ??
    (legacyEnableElectrs === true ? "electrs" : "none");

  // Declare dependency based on selected indexer
  // - electrs: we require it to be "synced" (matches your existing behavior)
  // - fulcrum: we require it to be running; if the Fulcrum package exposes a
  //            specific state like "synced" or "ready", replace [] accordingly.
  const depsIndexer: { [key: string]: string[] } =
    indexerType === "electrs"
      ? { electrs: ["synced"] }
      : indexerType === "fulcrum"
      ? { fulcrum: [] }
      : {};

  // Lightning dependencies remain the same
  const depsLnd: { [key: string]: string[] } =
    newConfig?.lightning?.type === "lnd" ? { lnd: [] } : {};

  const depsCln: { [key: string]: string[] } =
    newConfig?.lightning?.type === "cln" ? { "c-lightning": [] } : {};

  return compat.setConfig(effects, newConfig, {
    ...depsIndexer,
    ...depsLnd,
    ...depsCln,
  });
};
