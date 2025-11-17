import { BaseError } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type { GenericRecord } from "@webiny/utils";

export class ModelNotAuthorizedError extends BaseError {
    override readonly code = "Cms/Model/NotAuthorized" as const;

    constructor(message?: string) {
        super({
            message: message || `Not allowed to access content models.`
        });
    }

    static fromModel(model: CmsModel): ModelNotAuthorizedError {
        return new ModelNotAuthorizedError(
            `Not allowed to access content model "${model.modelId}".`
        );
    }
}

export class ModelNotFoundError extends BaseError {
    override readonly code = "Cms/Model/NotFound" as const;

    constructor(modelId: string) {
        super({
            message: `Model "${modelId}" was not found!`
        });
    }
}

interface ModelAlreadyExistsParams {
    modelId: string;
    message?: string;
}

export class ModelAlreadyExistsError extends BaseError<{ modelId: string }> {
    override readonly code = "Cms/Model/AlreadyExists" as const;

    constructor(params: ModelAlreadyExistsParams) {
        super({
            message: params.message ?? `Model "${params.modelId}" already exists!`,
            data: { modelId: params.modelId }
        });
    }
}

export class ModelPersistenceError extends BaseError {
    override readonly code = "Cms/Model/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class ModelValidationError extends BaseError<GenericRecord<string> | undefined> {
    override readonly code = "Cms/Model/ValidationError" as const;

    constructor(params: { message: string; data?: GenericRecord<string> } | string) {
        if (typeof params === "string") {
            super({ message: params });
            return;
        }

        super({
            message: params.message,
            data: params.data ?? undefined
        });
    }
}

export class ModelCannotUpdateCodeModelError extends BaseError<{ modelId: string }> {
    override readonly code = "Cms/Model/CannotUpdateCodeModel" as const;

    constructor(modelId: string) {
        super({
            message: `Cannot update model "${modelId}" defined via code.`,
            data: { modelId }
        });
    }
}

export class ModelCannotDeleteCodeModelError extends BaseError<{ modelId: string }> {
    override readonly code = "Cms/Model/CannotDeleteCodeModel" as const;

    constructor(modelId: string) {
        super({
            message: `Cannot delete model "${modelId}" defined via code.`,
            data: { modelId }
        });
    }
}

export class ModelSlugTakenError extends BaseError {
    override readonly code = "Cms/Model/SlugTaken" as const;

    constructor(slug: string) {
        super({
            message: `Model slug/API name "${slug}" is already taken.`
        });
    }
}

export class ModelCannotDeleteHasEntriesError extends BaseError {
    override readonly code = "Cms/Model/CannotDeleteHasEntries" as const;

    constructor(modelId: string) {
        super({
            message: `Cannot delete content model "${modelId}" because there are existing entries.`
        });
    }
}

export class ModelCannotDeleteHasEntriesInTrashError extends BaseError {
    override readonly code = "Cms/Model/CannotDeleteHasEntriesInTrash" as const;

    constructor(modelId: string) {
        super({
            message: `Cannot delete content model "${modelId}" because there are existing entries in the trash.`
        });
    }
}
