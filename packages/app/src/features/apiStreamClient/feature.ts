import { ApiStreamClient } from "./abstractions.js";
import { FetchApiStreamClient } from "./FetchApiStreamClient.js";
import { createFeature } from "~/shared/di/createFeature.js";

export const ApiStreamClientFeature = createFeature({
    name: "ApiStreamClient",
    register(container) {
        container.register(FetchApiStreamClient).inSingletonScope();
    },
    resolve(container) {
        return {
            client: container.resolve(ApiStreamClient)
        };
    }
});
