import { createFeature } from "@webiny/feature/api";
import { CreateUserUseCase } from "./CreateUserUseCase.js";
import { CreateUserWithWcpIncrement } from "./decorators/CreateUserWithWcpIncrement.js";

export const CreateUserFeature = createFeature({
    name: "CreateUser",
    register(container) {
        container.register(CreateUserUseCase);
        container.registerDecorator(CreateUserWithWcpIncrement);
    }
});
