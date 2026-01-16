import { createFeature } from "@webiny/feature/api";
import { CreateUserUseCase } from "./CreateUserUseCase.js";

export const CreateUserFeature = createFeature({
    name: "CreateUserFeature",
    register(container) {
        container.register(CreateUserUseCase);
    }
});
