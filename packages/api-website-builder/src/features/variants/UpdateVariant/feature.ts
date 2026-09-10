import { createFeature } from "@webiny/feature/api";
import { UpdateVariantRepository } from "./UpdateVariantRepository.js";
import { UpdateVariantUseCase } from "./UpdateVariantUseCase.js";

export const UpdateVariantFeature = createFeature({
    name: "WebsiteBuilder/UpdateVariant",
    register(container) {
        container.register(UpdateVariantRepository).inSingletonScope();
        container.register(UpdateVariantUseCase);
    }
});
