import { createFeature } from "@webiny/feature/api";
import { DeleteThreadUseCase } from "./DeleteThreadUseCase.js";
import { DeleteThreadRepository } from "./DeleteThreadRepository.js";

export const DeleteThreadFeature = createFeature({
    name: "Collaboration/DeleteThread",
    register(container) {
        container.register(DeleteThreadRepository).inSingletonScope();
        container.register(DeleteThreadUseCase);
    }
});
