import { MainGraphQLClient } from "./abstractions.js";
import { DefaultMainGraphQLClient } from "./MainGraphQLClient.js";
import { createFeature } from "~/shared/di/createFeature.js";

export const MainGraphQLClientFeature = createFeature({
    name: "MainGraphQLClient",
    register(container) {
        container.register(DefaultMainGraphQLClient).inSingletonScope();
    },
    resolve(container) {
        return {
            client: container.resolve(MainGraphQLClient)
        };
    }
});
