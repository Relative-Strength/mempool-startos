import { matches, types as T, YAML } from "../deps.ts";
const { shape, boolean } = matches;

// Legacy check
const matchElectrs = shape({
  "enable-electrs": boolean,
});

export const migration_up_2_3_1_4: T.ExpectedExports.migration = async (
  effects,
  _version,
) => {
  try {
    await effects.createDir({
      volumeId: "main",
      path: "start9",
    });
    const config = await effects.readFile({
      volumeId: "main",
      path: "start9/config.yaml",
    });
    const parsed = YAML.parse(config);

    // Newer config accepted too: indexer.type present means configured
    const hasIndexer =
      parsed?.indexer && typeof parsed.indexer?.type === "string";

    if (hasIndexer || matchElectrs.test(parsed)) {
      return { result: { configured: true } };
    }

    return { result: { configured: false } };
  } catch {
    // Assume configured on read errors (existing behavior)
    return { result: { configured: true } };
  }
};
