import { createFeature } from "@webiny/feature/api";
import { CreateLayoutRepository } from "./CreateLayoutRepository.js";
import { CreateLayoutUseCase } from "./CreateLayoutUseCase.js";

export const CreateLayoutFeature = createFeature({
    name: "WebsiteBuilder/CreateLayout",
    register(container) {
        container.register(CreateLayoutRepository).inSingletonScope();
        container.register(CreateLayoutUseCase);
    }
});
