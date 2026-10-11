import { BaseError } from "@webiny/feature/api";

/** Workflow actions need a signed-in identity; returned to app wrappers by `CurrentReviewViewer`. */
export class WorkflowsNotAuthenticatedError extends BaseError {
    override readonly code = "Workflows/NotAuthenticated" as const;

    constructor() {
        super({ message: "You must be signed in to use workflows." });
    }
}
