import { createFeature } from "@webiny/feature/api";
import { GetLatestPageByPathRepository } from "./GetLatestPageByPathRepository.js";
import { GetLatestPageByPathUseCase } from "./GetLatestPageByPathUseCase.js";

export const GetLatestPageByPathFeature = createFeature({
    name: "WebsiteBuilder/GetLatestPageByPath",
    register(container) {
        container.register(GetLatestPageByPathRepository).inSingletonScope();
        container.register(GetLatestPageByPathUseCase);
    }
});
