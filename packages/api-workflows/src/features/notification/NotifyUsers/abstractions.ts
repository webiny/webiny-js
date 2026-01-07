import { createAbstraction } from "@webiny/feature/createAbstraction.js";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";
import type { IWorkflowState } from "~/domain/workflowState/abstractions.js";
import type { Result } from "@webiny/feature/api/index.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import {
    type INotificationAdapterMessage,
    NotificationAdapter
} from "~/domain/notification/abstractions.js";

/**
 * Get Workflow
 */
export interface IGetWorkflowExecuteParams {
    id: string;
    app: string;
}

export interface IGetWorkflow {
    /**
     * This method should log errors internally and return null if the workflow is not found.
     */
    execute(params: IGetWorkflowExecuteParams): Promise<IWorkflow | null>;
}

export const GetWorkflow = createAbstraction<IGetWorkflow>("NotifyUsersGetWorkflow");

export namespace GetWorkflow {
    export type Interface = IGetWorkflow;
    export type Params = IGetWorkflowExecuteParams;
}

/**
 * Trigger Adapters
 */

export interface ITriggerAdaptersParams {
    workflow: IWorkflow;
    state: IWorkflowState;
    users: NonEmptyArray<NotificationAdapter.User>;
    message: INotificationAdapterMessage;
}

export type TriggerAdaptersResult = Promise<Result<void, unknown>>;

export interface ITriggerAdapters {
    hasAny(): boolean;
    execute(params: ITriggerAdaptersParams): Promise<TriggerAdaptersResult>;
}

export const TriggerAdapters = createAbstraction<ITriggerAdapters>("NotifyUsersTriggerAdapters");

export namespace TriggerAdapters {
    export type Interface = ITriggerAdapters;
    export type Params = ITriggerAdaptersParams;
    export type Result = TriggerAdaptersResult;
}
