import { BaseError } from "@webiny/feature/api";
import type { OutputErrors } from "@webiny/utils/createZodError.js";

export class GroupNotFoundError extends BaseError {
    override readonly code = "Cms/ModelGroup/NotFound" as const;

    constructor(groupId: string) {
        super({
            message: `Group "${groupId}" was not found!`
        });
    }
}

export class GroupSlugTakenError extends BaseError {
    override readonly code = "Cms/ModelGroup/SlugTaken" as const;

    constructor(slug: string) {
        super({
            message: `Group with the slug "${slug}" already exists.`
        });
    }
}

export class GroupStorageError extends BaseError {
    override readonly code = "Cms/ModelGroup/StorageError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

interface ValidationParams {
    invalidFields: OutputErrors;
}

export class GroupValidationError extends BaseError<ValidationParams> {
    override readonly code = "Cms/ModelGroup/ValidationFailed" as const;

    constructor(message: string, invalidFields: OutputErrors) {
        super({ message, data: { invalidFields } });
    }
}

export class GroupCannotUpdateCodeDefinedError extends BaseError {
    override readonly code = "Cms/ModelGroup/CannotUpdateCodeGroup" as const;

    constructor(groupId: string) {
        super({
            message: `Cannot update code-defined group "${groupId}"`
        });
    }
}

export class GroupCannotDeleteCodeDefinedError extends BaseError {
    override readonly code = "Cms/ModelGroup/CannotDeleteCodeGroup" as const;

    constructor(groupId: string) {
        super({
            message: `Cannot delete code-defined group "${groupId}"`
        });
    }
}

export class GroupHasModelsError extends BaseError {
    override readonly code = "Cms/ModelGroup/HasModels" as const;

    constructor() {
        super({
            message: `Cannot delete this group because there are models that belong to it.`
        });
    }
}

export class GroupNotAuthorizedError extends BaseError {
    override readonly code = "Cms/ModelGroup/NotAuthorized" as const;

    constructor(message?: string) {
        super({
            message: message || "Not allowed to access content model groups."
        });
    }
}
