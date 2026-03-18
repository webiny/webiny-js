import type { INamespaceHandlerResult } from "@webiny/api-scheduler/features/NamespaceHandler/abstractions.js";
import { SCHEDULED_ACTION_TYPE_PAGE, SCHEDULED_ACTION_TYPE_REDIRECT } from "~/constants.js";

export type IScheduledActionPayloadType =
    | typeof SCHEDULED_ACTION_TYPE_PAGE
    | typeof SCHEDULED_ACTION_TYPE_REDIRECT;

export interface IScheduledActionPayload extends INamespaceHandlerResult {
    type: IScheduledActionPayloadType;
}
