import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { CmsGraphQLClient } from "./abstractions.js";
import { DefaultCmsGraphQLClient } from "./CmsGraphQLClient.js";

export const CmsGraphQLClientFeature = createFeature({
    name: "CmsGraphQLClient",
    register(container) {
        container.register(DefaultCmsGraphQLClient).inSingletonScope();
    },
    resolve(container) {
        return {
            client: container.resolve(CmsGraphQLClient)
        };
    }
});
