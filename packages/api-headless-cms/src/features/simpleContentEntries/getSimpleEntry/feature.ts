import { createFeature } from "@webiny/feature/api";
import { GetSimpleEntryRepository } from "./GetSimpleEntryRepository.js";
import { GetSimpleEntryUseCase } from "./GetSimpleEntryUseCase.js";

export const GetSimpleEntryFeature = createFeature({
    name: "GetSimpleEntry",
    register(container) {
        container.register(GetSimpleEntryUseCase);
        container.register(GetSimpleEntryRepository).inSingletonScope();
    }
});
