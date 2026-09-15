import { createFeature } from "@webiny/feature/api";
import { UpdateThreadRepository } from "./UpdateThreadRepository.js";

export const UpdateThreadFeature = createFeature({
    name: "Collaboration/UpdateThread",
    register(container) {
        container.register(UpdateThreadRepository).inSingletonScope();
    }
});
