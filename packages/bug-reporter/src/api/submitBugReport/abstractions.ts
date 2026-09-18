import { createAbstraction } from "webiny/api";
import type { Result } from "webiny/api";
import type { BugReportStreamEvent } from "../../shared/types.js";
import type { IBugReportPayload } from "../../shared/types.js";
import type { SubmitBugReportError } from "./errors.js";

export interface ISubmitBugReportUseCase {
    /*
     * Everything knowable before work starts — authorization, an empty report — comes back as a
     * failed Result so the route can answer with a real status code. Only once that succeeds does
     * the caller get the generator, and from then on failures are `error` events in the stream.
     */
    execute(
        payload: IBugReportPayload
    ): Promise<Result<AsyncGenerator<BugReportStreamEvent>, SubmitBugReportError>>;
}

export const SubmitBugReportUseCase = createAbstraction<ISubmitBugReportUseCase>(
    "BugReport/SubmitBugReportUseCase"
);

export namespace SubmitBugReportUseCase {
    export type Interface = ISubmitBugReportUseCase;
    export type Error = SubmitBugReportError;
}
