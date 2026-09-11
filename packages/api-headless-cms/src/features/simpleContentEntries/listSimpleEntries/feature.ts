import { createFeature } from "@webiny/feature/api";
import { ListSimpleEntriesRepository } from "./ListSimpleEntriesRepository.js";
import { ListSimpleEntriesUseCase } from "./ListSimpleEntriesUseCase.js";

export const ListSimpleEntriesFeature = createFeature({
    name: "ListSimpleEntries",
    register(container) {
        container.register(ListSimpleEntriesUseCase);
        container.register(ListSimpleEntriesRepository).inSingletonScope();
    }
});
