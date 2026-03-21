import { OpenSearchClientFactory as OpenSearchClientFactoryAbstraction } from "./abstraction.js";
import { Client, type OpenSearchClientOptions, createOpenSearchClient } from "~/client.js";

class OpenSearchClientFactoryImpl implements OpenSearchClientFactoryAbstraction.Interface {
    public getClient(params: OpenSearchClientOptions): Client {
        if (!params.endpoint && !params.node && !params.nodes) {
            throw new Error(
                "OpenSearch client requires an endpoint, nodes or node to be specified."
            );
        }
        return createOpenSearchClient(params);
    }
}

export const OpenSearchClientFactory = OpenSearchClientFactoryAbstraction.createImplementation({
    implementation: OpenSearchClientFactoryImpl,
    dependencies: []
});
