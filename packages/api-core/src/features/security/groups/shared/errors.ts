import { BaseError } from "@webiny/feature/api";

export class GroupStorageError extends BaseError {
    override readonly code = "GROUP_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class GroupNotFoundError extends BaseError {
    override readonly code = "GROUP_NOT_FOUND" as const;

    constructor() {
        super({
            message: `Group was not found!`
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
            message: data.message || "Not authorized!",
            data
        });
    }
}

type GroupExistsErrorData = {
    slug: string;
};

export class GroupExistsError extends BaseError<GroupExistsErrorData> {
    override readonly code = "GROUP_EXISTS" as const;

    constructor(slug: string) {
        super({
            message: `Group with slug "${slug}" already exists.`,
            data: { slug }
        });
    }
}

export class CannotUpdatePluginGroupsError extends BaseError {
    override readonly code = "CANNOT_UPDATE_PLUGIN_GROUPS" as const;

    constructor() {
        super({
            message: "Cannot update groups created via plugins."
        });
    }
}

export class CannotDeletePluginGroupsError extends BaseError {
    override readonly code = "CANNOT_DELETE_PLUGIN_GROUPS" as const;

    constructor() {
        super({
            message: "Cannot delete groups created via plugins."
        });
    }
}

type GroupValidationErrorData = {
    message: string;
};

export class GroupValidationError extends BaseError<GroupValidationErrorData> {
    override readonly code = "GROUP_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}
