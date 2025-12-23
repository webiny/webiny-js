import type { IWorkflowNotification } from "~/types.js";
import type { IWorkflowError } from "~/Gateways/index.js";

export interface IWorkflowNotificationsRepository {
    readonly error: IWorkflowError | null;
    readonly loading: boolean;
    list(): Promise<IWorkflowNotification[]>;
}
