import { createFeature } from "@webiny/feature/api";
import { DeleteMessageUseCase } from "./DeleteMessageUseCase.js";

export const DeleteMessageFeature = createFeature({
    name: "Collaboration/DeleteMessage",
    register(container) {
        container.register(DeleteMessageUseCase);
    }
});
