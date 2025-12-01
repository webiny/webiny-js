import { BaseError } from "@webiny/feature/api";

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

export class TaskLogNotFoundError extends BaseError {
    override readonly code = "BackgroundTasks/Log/NotFoundError" as const;

    constructor() {
        super({
            message: "Task log not found."
        });
    }
}
