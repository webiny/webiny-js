import { createAbstraction } from "@webiny/feature/admin";
import type { BugReportStreamEvent } from "../../shared/types.js";
import type { IBugReportPayload } from "../../shared/types.js";

export interface ISubmitBugReportGateway {
    /*
     * Yields progress as the API works through drafting, uploads and issue creation, then one
     * terminal event. The caller owns the loop so it can narrate each step.
     */
    execute(payload: IBugReportPayload, signal?: AbortSignal): AsyncGenerator<BugReportStreamEvent>;
}

export const SubmitBugReportGateway = createAbstraction<ISubmitBugReportGateway>(
    "BugReport/SubmitBugReportGateway"
);

export namespace SubmitBugReportGateway {
    export type Interface = ISubmitBugReportGateway;
    export type Event = BugReportStreamEvent;
}
