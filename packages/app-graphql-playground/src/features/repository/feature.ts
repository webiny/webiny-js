import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { PlaygroundRepository } from "./abstractions.js";
import { DefaultPlaygroundRepository } from "./PlaygroundRepository.js";

export const PlaygroundRepositoryFeature = createFeature({
    name: "PlaygroundRepository",
    register(container) {
        container.register(DefaultPlaygroundRepository).inSingletonScope();
    },
    resolve(container) {
        return {
            repository: container.resolve(PlaygroundRepository)
        };
    }
});
