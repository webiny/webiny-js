import { createFeature } from "@webiny/feature/admin";
import { ListUsersUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { ListUsersUseCase } from "./ListUsersUseCase.js";
import { ListUsersGateway } from "./ListUsersGateway.js";

export const ListUsersFeature = createFeature({
    name: "Cognito/Users/ListUsers",
    register(container) {
        container.register(ListUsersUseCase);
        container.register(ListUsersGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
