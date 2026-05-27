import { BaseError } from "@webiny/feature/api";
import type { ZodError } from "zod";
import { parseZodError } from "@webiny/utils";
import type { ValidationIssue } from "@webiny/utils";

export class TaskDefinitionNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "BackgroundTasks/TaskDefinition/NotFoundError" as const;

    constructor(id: string) {
        super({
            message: "Task definition not found.",
            data: {
                id
            }
        });
    }
}

export class TaskNotFoundError extends BaseError {
    override readonly code = "BackgroundTasks/Task/NotFoundError" as const;

    constructor() {
        super({
            message: "Task not found."
        });
    }
}

export class TaskAbortError extends BaseError<{ id: string; status: string }> {
    override readonly code = "BackgroundTasks/Task/Abort" as const;

    constructor(data: { id: string; status: string }) {
        super({
            message: "Cannot abort a task that is not pending or running!",
            data
        });
    }
}

export class TaskLogNotFoundError extends BaseError {
    override readonly code = "BackgroundTasks/Log/NotFoundError" as const;

    constructor() {
        super({
            message: "Task log not found."
        });
    }
}

export class TaskServiceInfoError extends BaseError {
    override readonly code = "BackgroundTasks/Service/InfoUnavailable" as const;

    constructor() {
        super({
            message: "Unable to fetch service info."
        });
    }
}

interface BackgroundTaskValidationErrorData {
    issues: ValidationIssue[];
}

export class BackgroundTaskValidationError extends BaseError<BackgroundTaskValidationErrorData> {
    override readonly code = "BackgroundTasks/ValidationError" as const;

    constructor(error: string | ZodError) {
        if (typeof error === "string") {
            super({ message: error, data: { issues: [] } });
        } else {
            const issues = parseZodError(error);
            super({ message: "Validation failed.", data: { issues } });
        }
    }
}

interface BackgroundTaskPersistenceErrorData {
    originalMessage: string;
    originalCode?: string;
    originalData?: unknown;
}

export class BackgroundTaskPersistenceError extends BaseError<BackgroundTaskPersistenceErrorData> {
    override readonly code = "BackgroundTasks/PersistenceError" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { originalMessage: error.message } });
    }

    static from(error: unknown): BackgroundTaskPersistenceError {
        if (error instanceof Error) {
            const instance = new BackgroundTaskPersistenceError(error);
            const data: BackgroundTaskPersistenceErrorData = {
                originalMessage: error.message,
                originalCode: (error as any).code,
                originalData: (error as any).data
            };
            (instance as any).data = data;
            instance.stack = error.stack;
            return instance;
        }

        return new BackgroundTaskPersistenceError(new Error(String(error)));
    }
}

export class BackgroundTaskModelNotFoundError extends BaseError {
    override readonly code = "BackgroundTasks/ModelNotFound" as const;

    constructor(modelId: string) {
        super({ message: `Background task model "${modelId}" was not found.` });
    }
}

export class BackgroundTaskNotAuthorizedError extends BaseError {
    override readonly code = "BackgroundTasks/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized!" });
    }
}
