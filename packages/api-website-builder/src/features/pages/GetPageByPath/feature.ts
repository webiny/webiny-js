import { createFeature } from "@webiny/feature/api";
import { GetPageByPathRepository } from "./GetPageByPathRepository.js";
import { GetPageByPathUseCase } from "./GetPageByPathUseCase.js";

export const GetPageByPathFeature = createFeature({
    name: "WebsiteBuilder/GetPageByPath",
    register(container) {
        container.register(GetPageByPathRepository).inSingletonScope();
        container.register(GetPageByPathUseCase);
    }
});
