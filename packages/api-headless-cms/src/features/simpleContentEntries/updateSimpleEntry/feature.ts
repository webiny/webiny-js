import { createFeature } from "@webiny/feature/api";
import { UpdateSimpleEntryRepository } from "./UpdateSimpleEntryRepository.js";
import { UpdateSimpleEntryUseCase } from "./UpdateSimpleEntryUseCase.js";

export const UpdateSimpleEntryFeature = createFeature({
    name: "UpdateSimpleEntry",
    register(container) {
        container.register(UpdateSimpleEntryUseCase);
        container.register(UpdateSimpleEntryRepository).inSingletonScope();
    }
});
