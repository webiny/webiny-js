import { createFeature } from "@webiny/feature/api/index.js";
import { AwsOpenSearchClientFactory } from "./AwsOpenSearchClientFactory.js";

export const AwsOpenSearchClientFactoryFeature = createFeature({
    name: "opensearch.aws.clientFactory",
    register(container) {
        container.register(AwsOpenSearchClientFactory).inSingletonScope();
    }
});
