import { createFeature } from "@webiny/feature/api";
import { GetDeletedPageByIdUseCase } from "./GetDeletedPageByIdUseCase.js";
import { GetDeletedPageByIdRepository } from "./GetDeletedPageByIdRepository.js";

export const GetDeletedPageByIdFeature = createFeature({
    name: "WebsiteBuilder/GetDeletedPageById",
    register(container) {
        container.register(GetDeletedPageByIdRepository).inSingletonScope();
        container.register(GetDeletedPageByIdUseCase);
    }
});
