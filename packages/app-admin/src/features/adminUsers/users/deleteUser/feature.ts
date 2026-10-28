import { createFeature } from "@webiny/feature/admin";
import { DeleteUserUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { DeleteUserUseCase } from "./DeleteUserUseCase.js";
import { DeleteUserGateway } from "./DeleteUserGateway.js";

export const DeleteUserFeature = createFeature({
    name: "AdminUsers/DeleteUser",
    register(container) {
        container.register(DeleteUserUseCase);
        container.register(DeleteUserGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
