import { createFeature } from "@webiny/feature/api";
import { GetGlobalComponentRepository } from "./GetGlobalComponentRepository.js";
import { GetGlobalComponentUseCase } from "./GetGlobalComponentUseCase.js";

export const GetGlobalComponentFeature = createFeature({
    name: "WebsiteBuilder/GetGlobalComponent",
    register(container) {
        container.register(GetGlobalComponentRepository).inSingletonScope();
        container.register(GetGlobalComponentUseCase);
    }
});
