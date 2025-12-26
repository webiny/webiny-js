import { createFeature } from "@webiny/feature/api";
import { GetPublishedEntriesByIdsUseCase } from "./GetPublishedEntriesByIdsUseCase.js";
import { GetPublishedEntriesByIdsRepository } from "./GetPublishedEntriesByIdsRepository.js";
import { GetPublishedEntriesByIdsNotDeletedDecorator } from "./decorators/GetPublishedEntriesByIdsNotDeletedDecorator.js";

export const GetPublishedEntriesByIdsFeature = createFeature({
    name: "GetPublishedEntriesByIds",
    register(container) {
        container.register(GetPublishedEntriesByIdsUseCase);
        container.register(GetPublishedEntriesByIdsRepository).inSingletonScope();
        container.registerDecorator(GetPublishedEntriesByIdsNotDeletedDecorator);
    }
});
