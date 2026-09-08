import { createAbstraction } from "@webiny/feature/admin";
import type { IBugReportOutcome } from "../../shared/types.js";
import type { IBugReportPayload } from "../../shared/types.js";

export interface ISubmitBugReportGateway {
    execute(payload: IBugReportPayload): Promise<IBugReportOutcome>;
}

export const SubmitBugReportGateway = createAbstraction<ISubmitBugReportGateway>(
    "BugReport/SubmitBugReportGateway"
);

export namespace SubmitBugReportGateway {
    export type Interface = ISubmitBugReportGateway;
}
