import { createAbstraction } from "webiny/api";
import type { IBugReportPayload } from "../shared/types.js";
import type { IFiledIssue } from "../shared/types.js";

export interface ISubmitBugReportUseCase {
    execute(payload: IBugReportPayload): Promise<IFiledIssue>;
}

export const SubmitBugReportUseCase = createAbstraction<ISubmitBugReportUseCase>(
    "BugReport/SubmitBugReportUseCase"
);

export namespace SubmitBugReportUseCase {
    export type Interface = ISubmitBugReportUseCase;
}
