import { createFeature } from "@webiny/feature/api";
import { UpdateMessageUseCase } from "./UpdateMessageUseCase.js";

export const UpdateMessageFeature = createFeature({
    name: "Collaboration/UpdateMessage",
    register(container) {
        container.register(UpdateMessageUseCase);
    }
});
