import { OpenSearchClient as OpenSearchClientAbstraction } from "./abstraction.js";
import type { Client } from "~/types.js";
import { OpenSearchContext } from "~/features/OpenSearchContext/abstraction.js";

class OpenSearchClientImpl implements OpenSearchClientAbstraction.Interface {
    public constructor(private readonly context: OpenSearchContext.Interface) {}

    public use(): Client {
        return this.context.opensearch;
    }
}

export const OpenSearchClient = OpenSearchClientAbstraction.createImplementation({
    implementation: OpenSearchClientImpl,
    dependencies: [OpenSearchContext]
});
