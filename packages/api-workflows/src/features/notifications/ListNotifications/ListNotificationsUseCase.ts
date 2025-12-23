import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import {
    ListNotificationsRepository,
    ListNotificationsUseCase as UseCase
} from "./abstractions.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type {
    IWorkflowsSecurityPermission,
    WorkflowsSecurityPermissionAccessLevel
} from "~/types.js";
import { NotificationAuthorizedError } from "~/domain/notification/errors.js";

class ListNotificationsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private repository: ListNotificationsRepository.Interface
    ) {}

    public async execute(): UseCase.Return {
        const hasAccess = await this.ensureManageAccess();
        if (hasAccess.isFail()) {
            return Result.fail(hasAccess.error);
        }

        const result = await this.repository.execute();
        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }

    private async ensureManageAccess(): Promise<Result<void, NotificationAuthorizedError>> {
        const permissions =
            await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(
                WORKFLOWS_PERMISSION
            );

        for (const permission of permissions) {
            if (permission.name === "*") {
                return Result.ok();
            } else if (permission.editor === ("yes" as WorkflowsSecurityPermissionAccessLevel)) {
                return Result.ok();
            }
        }

        return Result.fail(new NotificationAuthorizedError("You cannot list notifications."));
    }
}

export const ListNotificationsUseCase = UseCase.createImplementation({
    implementation: ListNotificationsUseCaseImpl,
    dependencies: [IdentityContext, ListNotificationsRepository]
});
