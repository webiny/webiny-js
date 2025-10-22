import { createFeature } from "@webiny/feature/api";
import { DeleteGroupUseCaseImpl } from "./DeleteGroupUseCase.js";

export const DeleteGroupFeature = createFeature({
    name: "DeleteGroup",
    register(container) {
        container.register(DeleteGroupUseCaseImpl);
    }
});
