import { createFeature } from "@webiny/feature/api";
import { UpdatePageRepository } from "./UpdatePageRepository.js";
import { UpdatePageUseCase } from "./UpdatePageUseCase.js";

export const UpdatePageFeature = createFeature({
    name: "WebsiteBuilder/UpdatePage",
    register(container) {
        container.register(UpdatePageRepository).inSingletonScope();
        container.register(UpdatePageUseCase);
    }
});
