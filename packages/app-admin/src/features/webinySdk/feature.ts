import { createFeature } from "@webiny/feature/admin";
import type { Container } from "@webiny/di";
import { WebinySdk as Abstraction } from "./abstractions.js";
import { WebinySdk } from "./WebinySdk.js";

export const WebinySdkFeature = createFeature({
    name: "WebinySdk",
    register(container: Container) {
        container.register(WebinySdk).inSingletonScope();
    },
    resolve(container: Container) {
        return {
            sdk: container.resolve(Abstraction)
        };
    }
});
