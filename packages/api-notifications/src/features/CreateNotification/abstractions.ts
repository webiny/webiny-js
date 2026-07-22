import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type {
    INotification,
    NotificationIdentity,
    NotificationLink,
    NotificationType
} from "~/domain/notification/abstractions.js";
import type { NotificationPersistenceError } from "~/domain/notification/errors.js";

export interface ICreateNotificationInput {
    recipientId: string;
    type: NotificationType;
    actor: NotificationIdentity;
    title: string;
    snippet?: string | null;
    link?: NotificationLink | null;
}

export interface ICreateNotificationUseCase {
    execute(
        input: ICreateNotificationInput
    ): Promise<Result<INotification, NotificationPersistenceError>>;
}

export const CreateNotificationUseCase = createAbstraction<ICreateNotificationUseCase>(
    "CreateNotificationUseCase"
);

export namespace CreateNotificationUseCase {
    export type Interface = ICreateNotificationUseCase;
    export type Input = ICreateNotificationInput;
}
