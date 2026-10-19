import { Result } from "@webiny/feature/api";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { NotificationTransportInfo } from "~/domain/notifications/types.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListNotificationTransportsUseCase } from "~/features/notifications/ListNotificationTransports/index.js";
import { ListWorkflowNotificationTransportsUseCase as UseCase } from "./abstractions.js";

class ListWorkflowNotificationTransportsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private listTransports: ListNotificationTransportsUseCase.Interface
    ) {}

    async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        if (!canEdit) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({ action: "list notification transports" })
            );
        }

        let rows: NotificationTransportInfo[];
        try {
            const result = await this.listTransports.execute();
            if (result.isFail()) {
                return Result.fail(new WorkflowPersistenceError(result.error));
            }
            rows = [...result.value];
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        rows.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
        return Result.ok(rows);
    }
}

export const ListWorkflowNotificationTransportsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowNotificationTransportsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, ListNotificationTransportsUseCase]
});
