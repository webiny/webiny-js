import { createFeature } from "@webiny/feature/api";
import { UpdateLayoutRepository } from "./UpdateLayoutRepository.js";
import { UpdateLayoutUseCase } from "./UpdateLayoutUseCase.js";

export const UpdateLayoutFeature = createFeature({
    name: "WebsiteBuilder/UpdateLayout",
    register(container) {
        container.register(UpdateLayoutRepository).inSingletonScope();
        container.register(UpdateLayoutUseCase);
    }
});
