import { createFeature } from "@webiny/feature/api";
import { UpdateGroupUseCaseImpl } from "./UpdateGroupUseCase.js";

export const UpdateGroupFeature = createFeature({
    name: "UpdateGroup",
    register(container) {
        container.register(UpdateGroupUseCaseImpl);
    }
});
