import { createFeature } from "@webiny/feature/api";
import { CreateGroupUseCase } from "./CreateGroupUseCase.js";

export const CreateGroupFeature = createFeature({
    name: "CreateGroup",
    register(container) {
        container.register(CreateGroupUseCase);
    }
});
