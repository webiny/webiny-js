import { createFeature } from "@webiny/feature/api";
import { ListEntriesUseCase } from "./ListEntriesUseCase.js";
import { ListEntriesRepository } from "./ListEntriesRepository.js";
import { ListLatestEntriesUseCase } from "./ListLatestEntriesUseCase.js";
import { ListPublishedEntriesUseCase } from "./ListPublishedEntriesUseCase.js";
import { ListDeletedEntriesUseCase } from "./ListDeletedEntriesUseCase.js";

export const ListEntriesFeature = createFeature({
    name: "ListEntries",
    register(container) {
        // Base use case and repository
        container.register(ListEntriesUseCase);
        container.register(ListEntriesRepository).inSingletonScope();

        // Specific listing variants using composition
        container.register(ListLatestEntriesUseCase);
        container.register(ListPublishedEntriesUseCase);
        container.register(ListDeletedEntriesUseCase);
    }
});
