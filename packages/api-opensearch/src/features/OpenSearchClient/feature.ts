import { createFeature } from "@webiny/feature/api/index.js";
import type { Client } from "~/client.js";
import { OpenSearchClient } from "./abstraction.js";

export const OpenSearchClientFeature = createFeature<Client>({
    name: "opensearch.internal.client",
    register(container, client) {
        container.registerInstance(OpenSearchClient, {
            use: () => {
                return client;
            }
        });
    }
});
