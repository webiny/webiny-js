import { createFeature } from "@webiny/feature/api";
import { CreateThreadUseCase } from "./CreateThreadUseCase.js";
import { CreateThreadRepository } from "./CreateThreadRepository.js";

export const CreateThreadFeature = createFeature({
    name: "Collaboration/CreateThread",
    register(container) {
        container.register(CreateThreadRepository).inSingletonScope();
        container.register(CreateThreadUseCase);
    }
});
