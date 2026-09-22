import { createFeature } from "@webiny/feature/api";
import { DeletePageRevisionRepository } from "./DeletePageRevisionRepository.js";
import { DeletePageRevisionUseCase } from "./DeletePageRevisionUseCase.js";

export const DeletePageRevisionFeature = createFeature({
    name: "WebsiteBuilder/DeletePageRevision",
    register(container) {
        container.register(DeletePageRevisionRepository).inSingletonScope();
        container.register(DeletePageRevisionUseCase);
    }
});
