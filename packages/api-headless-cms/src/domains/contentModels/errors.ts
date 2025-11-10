import { BaseError } from "@webiny/feature/api";

export class ModelNotFoundError extends BaseError {
    override readonly code = "MODEL_NOT_FOUND" as const;

    constructor(modelId: string) {
        super({
            message: `Model "${modelId}" was not found!`
        });
    }
}

export class ModelAlreadyExistsError extends BaseError {
    override readonly code = "MODEL_ALREADY_EXISTS" as const;

    constructor(modelId: string) {
        super({
            message: `Model "${modelId}" already exists!`
        });
    }
}

export class ModelStorageError extends BaseError {
    override readonly code = "MODEL_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class ModelValidationError extends BaseError {
    override readonly code = "MODEL_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

export class ModelCannotUpdateCodeDefinedError extends BaseError {
    override readonly code = "MODEL_CANNOT_UPDATE_CODE_DEFINED" as const;

    constructor(modelId: string) {
        super({
            message: `Cannot update model "${modelId}" defined via code`
        });
    }
}

export class ModelCannotDeleteCodeDefinedError extends BaseError {
    override readonly code = "MODEL_CANNOT_DELETE_CODE_DEFINED" as const;

    constructor(modelId: string) {
        super({
            message: `Cannot delete code-defined model "${modelId}"`
        });
    }
}
