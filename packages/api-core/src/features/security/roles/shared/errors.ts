import { BaseError } from "@webiny/feature/api";

export class RoleStorageError extends BaseError {
    override readonly code = "ROLE_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class RoleNotFoundError extends BaseError {
    override readonly code = "ROLE_NOT_FOUND" as const;

    constructor() {
        super({
            message: `Role was not found!`
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

type RoleExistsErrorData = {
    slug: string;
};

export class RoleExistsError extends BaseError<RoleExistsErrorData> {
    override readonly code = "ROLE_EXISTS" as const;

    constructor(slug: string) {
        super({
            message: `Role with slug "${slug}" already exists.`,
            data: { slug }
        });
    }
}

export class CannotUpdatePluginRolesError extends BaseError {
    override readonly code = "CANNOT_UPDATE_PLUGIN_ROLES" as const;

    constructor() {
        super({
            message: "Cannot update roles created via plugins."
        });
    }
}

export class CannotDeletePluginRolesError extends BaseError {
    override readonly code = "CANNOT_DELETE_PLUGIN_ROLES" as const;

    constructor() {
        super({
            message: "Cannot delete roles created via plugins."
        });
    }
}

type RoleValidationErrorData = {
    message: string;
};

export class RoleValidationError extends BaseError<RoleValidationErrorData> {
    override readonly code = "ROLE_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}
