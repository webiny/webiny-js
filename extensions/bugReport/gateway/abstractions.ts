import { createAbstraction } from "webiny/admin";
import type { IBugReportPayload } from "../shared/types.js";
import type { IFiledIssue } from "../shared/types.js";

export interface ISubmitBugReportGateway {
    execute(payload: IBugReportPayload): Promise<IFiledIssue>;
}

export const SubmitBugReportGateway = createAbstraction<ISubmitBugReportGateway>(
    "BugReport/SubmitBugReportGateway"
);

export namespace SubmitBugReportGateway {
    export type Interface = ISubmitBugReportGateway;
}
