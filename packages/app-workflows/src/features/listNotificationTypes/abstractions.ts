import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowNotificationType } from "~/types.js";

export interface IListNotificationTypesGateway {
    execute(): Promise<IWorkflowNotificationType[]>;
}

export const ListNotificationTypesGateway = createAbstraction<IListNotificationTypesGateway>(
    "ListNotificationTypesGateway"
);

export namespace ListNotificationTypesGateway {
    export type Interface = IListNotificationTypesGateway;
}

export interface IListNotificationTypesUseCase {
    execute(): Promise<IWorkflowNotificationType[]>;
}

export const ListNotificationTypesUseCase = createAbstraction<IListNotificationTypesUseCase>(
    "ListNotificationTypesUseCase"
);

export namespace ListNotificationTypesUseCase {
    export type Interface = IListNotificationTypesUseCase;
}
