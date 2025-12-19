import { createFeature } from "@webiny/feature/api";
import { CreatePageRepository } from "./CreatePageRepository.js";
import { CreatePageUseCase } from "./CreatePageUseCase.js";

export const CreatePageFeature = createFeature({
    name: "WebsiteBuilder/CreatePage",
    register(container) {
        container.register(CreatePageRepository).inSingletonScope();
        container.register(CreatePageUseCase);
    }
});
