import { createFeature } from "@webiny/feature/api";
import { HttpClient } from "./HttpClient.js";

export const HttpClientFeature = createFeature({
    name: "HttpClientFeature",
    register(container) {
        container.register(HttpClient).inSingletonScope();
    }
});
