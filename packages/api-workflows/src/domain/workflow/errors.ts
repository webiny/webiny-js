import { BaseError } from "@webiny/feature/api";

export class WorkflowNotFoundError extends BaseError {
    override readonly code = "Workflows/Workflow/NotFound" as const;

    constructor(id: string) {
        super({
            message: `Workflow "${id}" not found`,
            data: { id }
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
