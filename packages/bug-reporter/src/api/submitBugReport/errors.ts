import { BaseError } from "webiny/api";

/*
 * The reporter is not signed in. Filing runs under the server's GitHub token, so this is the
 * difference between "the team reports bugs" and "anyone who can reach the API opens issues and
 * commits files under our PAT".
 */
export class BugReportNotAuthorizedError extends BaseError {
    readonly code = "BUG_REPORT_NOT_AUTHORIZED";

    constructor() {
        super({ message: "You have to be signed in to report a bug." });
    }
}

/* Nothing to report: no description and no screenshot. */
export class BugReportEmptyError extends BaseError {
    readonly code = "BUG_REPORT_EMPTY";

    constructor() {
        super({ message: "A report needs a description or at least one screenshot." });
    }
}

export type SubmitBugReportError = BugReportNotAuthorizedError | BugReportEmptyError;
