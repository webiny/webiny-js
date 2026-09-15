import { createFeature } from "@webiny/feature/api";
import { GraduateVariantRepository } from "./GraduateVariantRepository.js";
import { GraduateVariantUseCase } from "./GraduateVariantUseCase.js";

export const GraduateVariantFeature = createFeature({
    name: "WebsiteBuilder/GraduateVariant",
    register(container) {
        container.register(GraduateVariantRepository).inSingletonScope();
        container.register(GraduateVariantUseCase);
    }
});
