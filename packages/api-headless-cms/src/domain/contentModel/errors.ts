import { BaseError } from "@webiny/feature/api";

export class ModelNotFoundError extends BaseError {
    override readonly code = "Cms/Model/NotFound" as const;

    constructor(modelId: string) {
        super({
            message: `Model "${modelId}" was not found!`
        });
    }
}

export class ModelAlreadyExistsError extends BaseError {
    override readonly code = "Cms/Model/AlreadyExists" as const;

    constructor(modelId: string) {
        super({
            message: `Model "${modelId}" already exists!`
        });
    }
}

export class ModelStorageError extends BaseError {
    override readonly code = "Cms/Model/StorageError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class ModelValidationError extends BaseError {
    override readonly code = "Cms/Model/ValidationError" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

export class ModelCannotUpdateCodeDefinedError extends BaseError {
    override readonly code = "Cms/Model/CannotUpdateCodeModel" as const;

    constructor(modelId: string) {
        super({
            message: `Cannot update model "${modelId}" defined via code`
        });
    }
}

export class ModelCannotDeleteCodeDefinedError extends BaseError {
    override readonly code = "Cms/Model/CannotDeleteCodeModel" as const;

    constructor(modelId: string) {
        super({
            message: `Cannot delete code-defined model "${modelId}"`
        });
    }
}
