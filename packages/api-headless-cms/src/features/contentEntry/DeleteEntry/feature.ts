import { createFeature } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "./DeleteEntryUseCase.js";
import { DeleteEntryRepository } from "./DeleteEntryRepository.js";
import { MoveEntryToBinUseCase } from "./MoveEntryToBinUseCase.js";
import { MoveEntryToBinRepository } from "./MoveEntryToBinRepository.js";
import { ForceDeleteDecorator } from "./decorators/ForceDeleteDecorator.js";

export const DeleteEntryFeature = createFeature({
    name: "DeleteEntry",
    register(container) {
        // Register repositories (singleton scope)
        container.register(DeleteEntryRepository).inSingletonScope();
        container.register(MoveEntryToBinRepository).inSingletonScope();

        // Register use cases (transient scope)
        container.register(DeleteEntryUseCase);
        container.register(MoveEntryToBinUseCase);

        // Register decorators
        container.registerDecorator(ForceDeleteDecorator);
    }
});
