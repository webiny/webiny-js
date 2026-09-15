import { createFeature } from "@webiny/feature/api";
import { GetVariantByIdRepository } from "./GetVariantByIdRepository.js";
import { GetVariantByIdUseCase } from "./GetVariantByIdUseCase.js";

export const GetVariantByIdFeature = createFeature({
    name: "WebsiteBuilder/GetVariantById",
    register(container) {
        container.register(GetVariantByIdRepository).inSingletonScope();
        container.register(GetVariantByIdUseCase);
    }
});
