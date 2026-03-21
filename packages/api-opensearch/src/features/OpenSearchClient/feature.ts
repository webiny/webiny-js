import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchClient as OpenSearchClientAbstraction } from "./abstraction.js";
import { OpenSearchClient } from "./OpenSearchClient.js";
import type { OpenSearchContext } from "~/types.js";

export const OpenSearchClientFeature = createFeature<OpenSearchContext>({
    name: "opensearch.internal.client",
    register(container, context) {
        container.registerInstance(
            OpenSearchClientAbstraction,
            new OpenSearchClient(context!.opensearch)
        );
    }
});
