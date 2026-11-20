import { createFeature } from "@webiny/feature/api";
import { DeleteLayoutRevisionRepository } from "./DeleteLayoutRevisionRepository.js";
import { DeleteLayoutRevisionUseCase } from "./DeleteLayoutRevisionUseCase.js";

export const DeleteLayoutRevisionFeature = createFeature({
    name: "WebsiteBuilder/DeleteLayoutRevision",
    register(container) {
        container.register(DeleteLayoutRevisionRepository).inSingletonScope();
        container.register(DeleteLayoutRevisionUseCase);
    }
});
