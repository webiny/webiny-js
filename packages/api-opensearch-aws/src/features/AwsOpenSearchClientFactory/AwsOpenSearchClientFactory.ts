import { OpenSearchClientFactory as OpenSearchClientFactoryAbstraction } from "@webiny/api-opensearch/features/OpenSearchClientFactory/abstraction.js";
import type { Client, OpenSearchClientOptions } from "@webiny/api-opensearch";
import { createAwsOpenSearchClient } from "~/createAwsOpenSearchClient.js";

class AwsOpenSearchClientFactoryImpl implements OpenSearchClientFactoryAbstraction.Interface {
    public getClient(params: OpenSearchClientOptions): Client {
        if (!params.endpoint && !params.node && !params.nodes) {
            throw new Error(
                "OpenSearch client requires an endpoint, nodes or node to be specified."
            );
        }
        return createAwsOpenSearchClient(params);
    }
}

export const AwsOpenSearchClientFactory = OpenSearchClientFactoryAbstraction.createImplementation({
    implementation: AwsOpenSearchClientFactoryImpl,
    dependencies: []
});
