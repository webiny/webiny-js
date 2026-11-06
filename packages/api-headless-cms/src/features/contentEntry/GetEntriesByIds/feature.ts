import { createFeature } from "@webiny/feature/api";
import { GetEntriesByIdsUseCase } from "./GetEntriesByIdsUseCase.js";
import { GetEntriesByIdsRepository } from "./GetEntriesByIdsRepository.js";
import { GetEntriesByIdsNotDeletedDecorator } from "./decorators/GetEntriesByIdsNotDeletedDecorator.js";
import { GetEntriesByIdsOwnEntriesDecorator } from "./decorators/GetEntriesByIdsOwnEntriesDecorator.js";

export const GetEntriesByIdsFeature = createFeature({
    name: "GetEntriesByIds",
    register(container) {
        container.register(GetEntriesByIdsUseCase);
        container.register(GetEntriesByIdsRepository).inSingletonScope();
        container.registerDecorator(GetEntriesByIdsNotDeletedDecorator);
        container.registerDecorator(GetEntriesByIdsOwnEntriesDecorator);
    }
});
