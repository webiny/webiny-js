import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    ListNotificationTypesRepository,
    ListNotificationTypesUseCase as UseCase
} from "./abstractions.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type { IWorkflowsSecurityPermission } from "~/types.js";
import { NotificationAuthorizedError } from "~/domain/notifications/errors.js";

class ListNotificationTypesUseCaseImpl implements UseCase.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private repository: ListNotificationTypesRepository.Interface
    ) {}

    public async execute(): UseCase.Return {
        const hasAccess = await this.ensureAccess();
        if (hasAccess.isFail()) {
            return Result.fail(hasAccess.error);
        }

        const result = await this.repository.execute();
        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }

    private async ensureAccess(): Promise<Result<void, NotificationAuthorizedError>> {
        const permissions =
            await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(
                WORKFLOWS_PERMISSION
            );

        for (const permission of permissions) {
            if (permission.name === "*") {
                return Result.ok();
            } else if (permission.editor) {
                return Result.ok();
            }
        }

        return Result.fail(new NotificationAuthorizedError("You cannot list notifications."));
    }
}

export const ListNotificationTypesUseCase = UseCase.createImplementation({
    implementation: ListNotificationTypesUseCaseImpl,
    dependencies: [IdentityContext, ListNotificationTypesRepository]
});
