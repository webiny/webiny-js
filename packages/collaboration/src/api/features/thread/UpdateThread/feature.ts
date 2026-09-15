import { createFeature } from "@webiny/feature/api";
import { UpdateThreadUseCase } from "./UpdateThreadUseCase.js";
import { UpdateThreadRepository } from "./UpdateThreadRepository.js";

export const UpdateThreadFeature = createFeature({
    name: "Collaboration/UpdateThread",
    register(container) {
        container.register(UpdateThreadUseCase).inSingletonScope();
        container.register(UpdateThreadRepository).inSingletonScope();
    }
});
