import { createFeature } from "@webiny/feature/api/index.js";
import { DataLoadersHandler } from "./dataLoaders.js";

/**
 * Per-request half of the DynamoDB+OpenSearch CMS storage. Register it in the request (child)
 * container, never in the root: the DataLoader cache must live for one request only. A root singleton
 * outlives the request and keeps serving the entries it read first, until this same instance happens
 * to write.
 *
 * The entry storage operations stay in the root and resolve this dependency from the container that
 * resolves them, so each request gets its own loader.
 */
export const HeadlessCmsDdbEsRequestFeature = createFeature({
    name: "cms.storageOperations.openSearch.request",
    register: container => {
        container.register(DataLoadersHandler).inSingletonScope();
    }
});
