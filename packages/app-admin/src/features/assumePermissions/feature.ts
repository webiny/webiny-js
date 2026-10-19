import { createFeature } from "@webiny/feature/admin";
import type { Container } from "@webiny/di";
import { AssumePermissionsContext as AssumePermissionsContextAbstraction } from "./abstractions.js";
import { AssumePermissionsUseCase as AssumePermissionsUseCaseAbstraction } from "./abstractions.js";
import { AssumePermissionsContext } from "./AssumePermissionsContext.js";
import { AssumePermissionsUseCase } from "./AssumePermissionsUseCase.js";
import { GraphQLClientDecorator } from "./GraphQLClientDecorator.js";
import { ApiStreamClientDecorator } from "./ApiStreamClientDecorator.js";
import { ListAssumableTargetsGateway } from "./ListAssumableTargetsGateway.js";
import { ListAssumableTargetsUseCase } from "./ListAssumableTargetsUseCase.js";
import { LogInUseCaseDecorator } from "./LogInUseCaseDecorator.js";
import { LogOutUseCaseDecorator } from "./LogOutUseCaseDecorator.js";

export const AssumePermissionsFeature = createFeature({
    name: "AssumePermissions",
    register(container: Container) {
        container.register(AssumePermissionsContext).inSingletonScope();
        container.register(AssumePermissionsUseCase);
        container.register(ListAssumableTargetsGateway).inSingletonScope();
        container.register(ListAssumableTargetsUseCase);
        container.registerDecorator(GraphQLClientDecorator);
        container.registerDecorator(ApiStreamClientDecorator);
        container.registerDecorator(LogInUseCaseDecorator);
        container.registerDecorator(LogOutUseCaseDecorator);
    },
    resolve(container: Container) {
        return {
            context: container.resolve(AssumePermissionsContextAbstraction),
            useCase: container.resolve(AssumePermissionsUseCaseAbstraction)
        };
    }
});
