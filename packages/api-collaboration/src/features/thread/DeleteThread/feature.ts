import { createFeature } from "@webiny/feature/api";
import { DeleteThreadUseCase } from "./DeleteThreadUseCase.js";

export const DeleteThreadFeature = createFeature({
    name: "Collaboration/DeleteThread",
    register(container) {
        container.register(DeleteThreadUseCase);
    }
});
