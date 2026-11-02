import { Result } from "@webiny/feature/api";
import { WorkflowLookupError } from "~/domain/workflow/errors.js";
import type { NotificationTransportInfo } from "~/domain/notifications/types.js";
import { WorkflowEditorAccess } from "~/features/permissions/WorkflowEditorAccess/index.js";
import { ListNotificationTransportsUseCase } from "~/features/notifications/ListNotificationTransports/index.js";
import { ListWorkflowNotificationTransportsUseCase as UseCase } from "./abstractions.js";

class ListWorkflowNotificationTransportsUseCaseImpl implements UseCase.Interface {
    constructor(
        private editorAccess: WorkflowEditorAccess.Interface,
        private listTransports: ListNotificationTransportsUseCase.Interface
    ) {}

    async execute(): UseCase.Return {
        const access = await this.editorAccess.check("list notification transports");
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        let rows: NotificationTransportInfo[];
        try {
            const result = await this.listTransports.execute();
            if (result.isFail()) {
                return Result.fail(new WorkflowLookupError(result.error));
            }
            rows = [...result.value];
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowLookupError(cause));
        }
        rows.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
        return Result.ok(rows);
    }
}

export const ListWorkflowNotificationTransportsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowNotificationTransportsUseCaseImpl,
    dependencies: [WorkflowEditorAccess, ListNotificationTransportsUseCase]
});
