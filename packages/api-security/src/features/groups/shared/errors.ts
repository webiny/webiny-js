import { BaseError } from "@webiny/feature/api";

export class GroupStorageError extends BaseError {
    override readonly code = "GROUP_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message,
            data: {}
        });
    }
}

export class GroupNotFoundError extends BaseError {
    override readonly code = "GROUP_NOT_FOUND" as const;

    constructor() {
        super({
            message: `Group was not found!`,
            data: {}
        });
    }
}

type NotAuthorizedErrorData = {
    message?: string;
};

export class NotAuthorizedError extends BaseError<NotAuthorizedErrorData> {
    override readonly code = "NOT_AUTHORIZED" as const;

    constructor(data: NotAuthorizedErrorData = {}) {
        super({
            message: data.message || "Not authorized to perform this action",
            data
        });
    }
}
