import { createFeature } from "@webiny/feature/api";
import { GetPageByIdUseCase } from "./GetPageByIdUseCase.js";
import { GetPageByIdRepository } from "./GetPageByIdRepository.js";

export const GetPageByIdFeature = createFeature({
    name: "WebsiteBuilder/GetPageById",
    register(container) {
        container.register(GetPageByIdRepository).inSingletonScope();
        container.register(GetPageByIdUseCase);
    }
});
