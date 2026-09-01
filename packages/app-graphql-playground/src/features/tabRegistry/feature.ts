import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { PlaygroundTabRegistry } from "./abstractions.js";
import { DefaultPlaygroundTabRegistry } from "./PlaygroundTabRegistry.js";

export const PlaygroundTabRegistryFeature = createFeature({
    name: "PlaygroundTabRegistry",
    register(container) {
        container.register(DefaultPlaygroundTabRegistry).inSingletonScope();
    },
    resolve(container) {
        return {
            registry: container.resolve(PlaygroundTabRegistry)
        };
    }
});
