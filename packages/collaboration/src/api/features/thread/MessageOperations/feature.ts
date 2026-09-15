import { createFeature } from "@webiny/feature/api";
import { UpdateMessageUseCase } from "./UpdateMessageUseCase.js";
import { DeleteMessageUseCase } from "./DeleteMessageUseCase.js";

export const MessageOperationsFeature = createFeature({
    name: "Collaboration/MessageOperations",
    register(container) {
        container.register(UpdateMessageUseCase);
        container.register(DeleteMessageUseCase);
    }
});
