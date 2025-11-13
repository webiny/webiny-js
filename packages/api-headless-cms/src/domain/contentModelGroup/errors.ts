import { BaseError } from "@webiny/feature/api";

export class GroupNotFoundError extends BaseError {
    override readonly code = "GROUP_NOT_FOUND" as const;

    constructor(groupId: string) {
        super({
            message: `Group "${groupId}" was not found!`
        });
    }
}

export class GroupAlreadyExistsError extends BaseError {
    override readonly code = "GROUP_ALREADY_EXISTS" as const;

    constructor(groupId: string) {
        super({
            message: `Group "${groupId}" already exists!`
        });
    }
}

export class GroupStorageError extends BaseError {
    override readonly code = "GROUP_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class GroupValidationError extends BaseError {
    override readonly code = "GROUP_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

export class GroupCannotUpdateCodeDefinedError extends BaseError {
    override readonly code = "GROUP_CANNOT_UPDATE_CODE_DEFINED" as const;

    constructor(groupId: string) {
        super({
            message: `Cannot update code-defined group "${groupId}"`
        });
    }
}

export class GroupCannotDeleteCodeDefinedError extends BaseError {
    override readonly code = "GROUP_CANNOT_DELETE_CODE_DEFINED" as const;

    constructor(groupId: string) {
        super({
            message: `Cannot delete code-defined group "${groupId}"`
        });
    }
}

export class GroupHasModelsError extends BaseError {
    override readonly code = "GROUP_HAS_MODELS" as const;

    constructor() {
        super({
            message: `Cannot delete this group because there are models that belong to it.`
        });
    }
}
