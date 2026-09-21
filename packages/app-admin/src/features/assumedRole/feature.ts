import { createFeature } from "@webiny/feature/admin";
import type { Container } from "@webiny/di";
import { AssumedRoleContext as AssumedRoleContextAbstraction } from "./abstractions.js";
import { AssumeRoleUseCase as AssumeRoleUseCaseAbstraction } from "./abstractions.js";
import { AssumedRoleContext } from "./AssumedRoleContext.js";
import { AssumeRoleUseCase } from "./AssumeRoleUseCase.js";
import { GraphQLClientDecorator } from "./GraphQLClientDecorator.js";
import { ApiStreamClientDecorator } from "./ApiStreamClientDecorator.js";
import { ListRolesFeature } from "~/features/accessManagement/roles/listRoles/feature.js";
import { ListTeamsFeature } from "~/features/accessManagement/teams/listTeams/feature.js";
import { AssumedRolePresenterFeature } from "~/presentation/assumedRole/feature.js";

export const AssumedRoleFeature = createFeature({
    name: "AssumedRole",
    register(container: Container) {
        /*
         * All of this registers in the ROOT container rather than through RegisterFeature in the
         * Admin config tree. The header control renders from the Layout, which mounts before that
         * tree does; a useFeature() miss there throws, and the error boundary keeps the subtree
         * dead even after the registration later arrives.
         */
        ListRolesFeature.register(container);
        ListTeamsFeature.register(container);
        AssumedRolePresenterFeature.register(container);
        container.register(AssumedRoleContext).inSingletonScope();
        container.register(AssumeRoleUseCase);
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
