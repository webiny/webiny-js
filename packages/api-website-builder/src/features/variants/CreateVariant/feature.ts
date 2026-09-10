import { createFeature } from "@webiny/feature/api";
import { CreateVariantRepository } from "./CreateVariantRepository.js";
import { CreateVariantUseCase } from "./CreateVariantUseCase.js";

export const CreateVariantFeature = createFeature({
    name: "WebsiteBuilder/CreateVariant",
    register(container) {
        container.register(CreateVariantRepository).inSingletonScope();
        container.register(CreateVariantUseCase);
    }
});
