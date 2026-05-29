import { createFeature } from "webiny/admin";
import { WebLlmService } from "./abstractions.js";
import { WebLlmServiceRegistration } from "./WebLlmService.js";

export const WebLlmFeature = createFeature({
    name: "WebLlm",
    register(container) {
        container.register(WebLlmServiceRegistration).inSingletonScope();
    },
    resolve(container) {
        return {
            service: container.resolve(WebLlmService)
        };
    }
});
