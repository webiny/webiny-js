import { createAbstraction, type Result } from "@webiny/feature/api";
import type { NotificationTransportInfo } from "~/domain/notifications/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface IListWorkflowNotificationTransportsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError =
    IListWorkflowNotificationTransportsUseCaseErrors[keyof IListWorkflowNotificationTransportsUseCaseErrors];

export interface IListWorkflowNotificationTransportsUseCase {
    execute(): Promise<Result<NotificationTransportInfo[], UseCaseError>>;
}

/**
 * The notification transports a workflow author can pick on a step (D129, R191): needs
 * `workflows.editor`. Sorted by title. The shared `listNotificationTransports` GraphQL operation
 * calls this.
 */
export const ListWorkflowNotificationTransportsUseCase =
    createAbstraction<IListWorkflowNotificationTransportsUseCase>(
        "ListWorkflowNotificationTransportsUseCase"
    );

export namespace ListWorkflowNotificationTransportsUseCase {
    export type Interface = IListWorkflowNotificationTransportsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<NotificationTransportInfo[], UseCaseError>>;
}
