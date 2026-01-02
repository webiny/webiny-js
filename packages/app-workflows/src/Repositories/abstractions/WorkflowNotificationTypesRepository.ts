import type { IWorkflowNotificationType } from "~/types.js";
import type { IWorkflowError } from "~/Gateways/index.js";

export interface IWorkflowNotificationTypesRepository {
    readonly error: IWorkflowError | null;
    readonly loading: boolean;
    list(): Promise<IWorkflowNotificationType[]>;
}
