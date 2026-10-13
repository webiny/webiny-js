import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { PlaygroundRepository } from "./abstractions.js";
import { DefaultPlaygroundRepository } from "./PlaygroundRepository.js";

export const PlaygroundRepositoryFeature = createFeature({
    name: "PlaygroundRepository",
    register(container) {
        // One per container, so it reads the tenant-prefixed LocalStorage of the container that resolves
        // it. A root singleton would see only the root LocalStorage and share tabs across tenants.
        container.register(DefaultPlaygroundRepository).inContainerScope();
    },
    resolve(container) {
        return {
            repository: container.resolve(PlaygroundRepository)
        };
    }
});
