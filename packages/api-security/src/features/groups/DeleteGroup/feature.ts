import { createFeature } from "@webiny/feature/api";
import { DeleteGroupUseCase } from "./DeleteGroupUseCase.js";

export const DeleteGroupFeature = createFeature({
    name: "DeleteGroup",
    register(container) {
        container.register(DeleteGroupUseCase);
    }
});
