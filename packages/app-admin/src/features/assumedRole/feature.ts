import { createFeature } from "@webiny/feature/admin";
import type { Container } from "@webiny/di";
import { AssumedRoleContext as AssumedRoleContextAbstraction } from "./abstractions.js";
import { AssumeRoleUseCase as AssumeRoleUseCaseAbstraction } from "./abstractions.js";
import { AssumedRoleContext } from "./AssumedRoleContext.js";
import { AssumeRoleUseCase } from "./AssumeRoleUseCase.js";
import { GraphQLClientDecorator } from "./GraphQLClientDecorator.js";
import { ApiStreamClientDecorator } from "./ApiStreamClientDecorator.js";
import { ListAssumableRolesGateway } from "./ListAssumableRolesGateway.js";
import { ListAssumableRolesUseCase } from "./ListAssumableRolesUseCase.js";

export const AssumedRoleFeature = createFeature({
    name: "AssumedRole",
    register(container: Container) {
        container.register(AssumedRoleContext).inSingletonScope();
        container.register(AssumeRoleUseCase);
        container.register(ListAssumableRolesGateway).inSingletonScope();
        container.register(ListAssumableRolesUseCase);
        container.registerDecorator(GraphQLClientDecorator);
        container.registerDecorator(ApiStreamClientDecorator);
    },
    resolve(container: Container) {
        return {
            context: container.resolve(AssumedRoleContextAbstraction),
            useCase: container.resolve(AssumeRoleUseCaseAbstraction)
        };
    }
});
