import { BaseError } from "@webiny/feature/api";

export class WorkflowNotFoundError extends BaseError<{ id: string; app: string }> {
    override readonly code = "Workflows/Workflow/NotFound" as const;

    constructor(data: { id: string; app: string }) {
        super({
            message: `Workflow "${data.id}" not found`,
            data
        });
    }
}

export class WorkflowNotAuthorizedError extends BaseError {
    override readonly code = "Workflows/Workflow/NotAuthorized" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized to access workflow"
        });
    }
}

export class WorkflowPersistenceError extends BaseError {
    override readonly code = "Workflows/Workflow/Persistence" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class WorkflowValidationError extends BaseError {
    override readonly code = "Workflows/Workflow/Validation" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}
