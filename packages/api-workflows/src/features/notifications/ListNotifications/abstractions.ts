import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotification } from "~/domain/notification/abstractions.js";
import { NotificationAuthorizedError } from "~/domain/notification/errors.js";
import type { IWorkflowState } from "~/domain/workflowState/abstractions.js";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";

/**
 * Notification Type interface - user needs to implement this according to their needs.
 */
export interface INotificationTypeExecuteParams {
    workflow: IWorkflow;
    workflowState: IWorkflowState;
}
export interface INotificationType extends INotification {
    execute(params: INotificationTypeExecuteParams): Promise<void>;
}

export const NotificationType = createAbstraction<INotificationType>("WorkflowNotificationType");

export namespace NotificationType {
    export type Interface = INotificationType;
    export type ExecuteParams = INotificationTypeExecuteParams;
}

/**
 * ListNotifications use case interface
 */
export interface IListNotificationsUseCase {
    execute(): Promise<Result<INotification[], UseCaseError>>;
}

export interface IListNotificationsUseCaseErrors {
    notAuthorized: NotificationAuthorizedError;
}

type UseCaseError = IListNotificationsUseCaseErrors[keyof IListNotificationsUseCaseErrors];

export const ListNotificationsUseCase = createAbstraction<IListNotificationsUseCase>(
    "ListNotificationsUseCase"
);

export namespace ListNotificationsUseCase {
    export type Interface = IListNotificationsUseCase;
    export type Return = Promise<Result<INotification[], UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * ListNotifications repository interface
 */
export interface IListNotificationsRepository {
    execute(): Promise<Result<INotification[]>>;
}

export const ListNotificationsRepository = createAbstraction<IListNotificationsRepository>(
    "ListNotificationsRepository"
);

export namespace ListNotificationsRepository {
    export type Interface = IListNotificationsRepository;
    export type Return = Promise<Result<INotification[]>>;
}
