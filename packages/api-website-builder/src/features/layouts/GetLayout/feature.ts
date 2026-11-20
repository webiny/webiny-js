import { createFeature } from "@webiny/feature/api";
import { GetLayoutRepository } from "./GetLayoutRepository.js";
import { GetLayoutUseCase } from "./GetLayoutUseCase.js";

export const GetLayoutFeature = createFeature({
    name: "WebsiteBuilder/GetLayout",
    register(container) {
        container.register(GetLayoutRepository).inSingletonScope();
        container.register(GetLayoutUseCase);
    }
});
