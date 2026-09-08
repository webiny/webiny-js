import { createAbstraction } from "@webiny/feature/api";
import type { IBugReportPayload } from "../shared/types.js";
import type { IBugReportOutcome } from "../shared/types.js";

export interface ISubmitBugReportUseCase {
    execute(payload: IBugReportPayload): Promise<IBugReportOutcome>;
}

export const SubmitBugReportUseCase = createAbstraction<ISubmitBugReportUseCase>(
    "BugReport/SubmitBugReportUseCase"
);

export namespace SubmitBugReportUseCase {
    export type Interface = ISubmitBugReportUseCase;
}
