import { createFeature } from "@webiny/feature/api";
import { CreateGroupUseCaseImpl } from "./CreateGroupUseCase.js";

export const CreateGroupFeature = createFeature({
    name: "CreateGroup",
    register(container) {
        container.register(CreateGroupUseCaseImpl);
    }
});
