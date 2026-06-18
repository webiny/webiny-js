import { registerOpensearchCore } from "./registerOpensearchCore.js";

export * from "./indexConfiguration/index.js";
export * from "./plugins/index.js";
export * from "./sort.js";
export * from "./indices.js";
export * from "./where.js";
export * from "./limit.js";
export * from "./normalize.js";
export * from "./operators.js";
export * from "./cursors.js";
export {
    createOpenSearchClient,
    type Client,
    type ClientOptions,
    type OpenSearchClientOptions
} from "./client.js";
export * from "./utils/index.js";
export * from "./operations/index.js";
export * from "./sharedIndex.js";
export * from "./indexPrefix.js";
export * from "./db/index.js";
export * from "./types.js";
export { registerOpensearchCore };
