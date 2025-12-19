import { createFeature } from "@webiny/feature/api";
import { DeletePageRepository } from "./DeletePageRepository.js";
import { DeletePageUseCase } from "./DeletePageUseCase.js";

export const DeletePageFeature = createFeature({
    name: "WebsiteBuilder/DeletePage",
    register(container) {
        container.register(DeletePageRepository).inSingletonScope();
        container.register(DeletePageUseCase);
    }
});
