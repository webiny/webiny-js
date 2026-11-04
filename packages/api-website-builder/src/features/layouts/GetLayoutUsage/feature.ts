import { createFeature } from "@webiny/feature/api";
import { CountLayoutPagesRepository } from "./CountLayoutPagesRepository.js";
import { ListLayoutModelsRepository } from "./ListLayoutModelsRepository.js";
import { GetLayoutUsageUseCase } from "./GetLayoutUsageUseCase.js";

export const GetLayoutUsageFeature = createFeature({
    name: "WebsiteBuilder/GetLayoutUsage",
    register(container) {
        container.register(CountLayoutPagesRepository).inSingletonScope();
        container.register(ListLayoutModelsRepository).inSingletonScope();
        container.register(GetLayoutUsageUseCase);
    }
});
