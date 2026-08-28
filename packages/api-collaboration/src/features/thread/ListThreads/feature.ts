import { createFeature } from "@webiny/feature/api";
import { ListThreadsUseCase } from "./ListThreadsUseCase.js";
import { ListThreadsRepository } from "./ListThreadsRepository.js";

export const ListThreadsFeature = createFeature({
    name: "Collaboration/ListThreads",
    register(container) {
        container.register(ListThreadsRepository).inSingletonScope();
        container.register(ListThreadsUseCase);
    }
});
