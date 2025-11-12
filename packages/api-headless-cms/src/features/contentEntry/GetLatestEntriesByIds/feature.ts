import { createFeature } from "@webiny/feature/api";
import { GetLatestEntriesByIdsUseCase } from "./GetLatestEntriesByIdsUseCase.js";
import { GetLatestEntriesByIdsRepository } from "./GetLatestEntriesByIdsRepository.js";
import { GetLatestEntriesByIdsNotDeletedDecorator } from "./decorators/GetLatestEntriesByIdsNotDeletedDecorator.js";

export const GetLatestEntriesByIdsFeature = createFeature({
    name: "GetLatestEntriesByIds",
    register(container) {
        container.register(GetLatestEntriesByIdsUseCase);
        container.register(GetLatestEntriesByIdsRepository).inSingletonScope();
        container.registerDecorator(GetLatestEntriesByIdsNotDeletedDecorator);
    }
});
