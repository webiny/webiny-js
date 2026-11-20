import { createFeature } from "@webiny/feature/api";
import { DeleteLayoutRepository } from "./DeleteLayoutRepository.js";
import { DeleteLayoutUseCase } from "./DeleteLayoutUseCase.js";

export const DeleteLayoutFeature = createFeature({
    name: "WebsiteBuilder/DeleteLayout",
    register(container) {
        container.register(DeleteLayoutRepository).inSingletonScope();
        container.register(DeleteLayoutUseCase);
    }
});
