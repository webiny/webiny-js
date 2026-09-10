import { createFeature } from "@webiny/feature/api";
import { DeleteVariantRepository } from "./DeleteVariantRepository.js";
import { DeleteVariantUseCase } from "./DeleteVariantUseCase.js";

export const DeleteVariantFeature = createFeature({
    name: "WebsiteBuilder/DeleteVariant",
    register(container) {
        container.register(DeleteVariantRepository).inSingletonScope();
        container.register(DeleteVariantUseCase);
    }
});
