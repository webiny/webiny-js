import { BaseError } from "@webiny/feature/api";

export class LayoutNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "WebsiteBuilder/Layout/NotFound" as const;

    constructor(id: string) {
        super({
            message: `Layout "${id}" was not found!`,
            data: { id }
        });
    }
}

export class LayoutPersistenceError extends BaseError<{ error: Error }> {
    override readonly code = "WebsiteBuilder/Layout/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: `Layout persistence error: ${error.message}`,
            data: { error }
        });
    }
}

export class LayoutValidationError extends BaseError {
    override readonly code = "WebsiteBuilder/Layout/ValidationError" as const;

    constructor(message: string) {
        super({
            message: `Layout validation error: ${message}`
        });
    }
}

export class LayoutNotAuthorizedError extends BaseError {
    override readonly code = "WebsiteBuilder/Layout/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized!" });
    }
}

export class LayoutLockedError extends BaseError<{ id: string }> {
    override readonly code = "WebsiteBuilder/Layout/Locked" as const;

    constructor(id: string) {
        super({
            message: `Layout revision "${id}" is locked: create a new revision to change it.`,
            data: { id }
        });
    }
}

export class LayoutTranslationError extends BaseError<{ id: string; language: string }> {
    override readonly code = "WebsiteBuilder/Layout/TranslationError" as const;

    constructor(params: { id: string; language: string; message: string }) {
        super({
            message: params.message,
            data: { id: params.id, language: params.language }
        });
    }
}

export interface LayoutSlugTakenErrorData {
    slug: string;
    // The entry id and title of the source layout that has the slug.
    layoutId: string;
    title: string;
}

export class LayoutSlugTakenError extends BaseError<LayoutSlugTakenErrorData> {
    override readonly code = "WebsiteBuilder/Layout/SlugTaken" as const;

    constructor(data: LayoutSlugTakenErrorData) {
        super({
            message: `This slug is already taken: "${data.slug}" is the slug of the "${data.title}" layout.`,
            data
        });
    }
}

export interface LayoutUsedByModel {
    modelId: string;
    name: string;
}

export interface LayoutInUseErrorData {
    // The entry id of the layout.
    id: string;
    // The number of pages (not in the trash) rendered with the layout.
    pages: number;
    // Whether the layout is the tenant's default layout.
    isDefault: boolean;
    // The CMS models whose `layout` setting names the layout's slug.
    models: LayoutUsedByModel[];
}

const modelsReason = (models: LayoutUsedByModel[]) => {
    const names = models.map(model => `"${model.name}"`).join(", ");
    return models.length === 1 ? `the ${names} model uses it` : `the ${names} models use it`;
};

export class LayoutInUseError extends BaseError<LayoutInUseErrorData> {
    override readonly code = "WebsiteBuilder/Layout/InUse" as const;

    constructor(data: LayoutInUseErrorData) {
        const reasons: string[] = [];
        if (data.isDefault) {
            reasons.push("it is the default layout");
        }
        if (data.pages > 0) {
            reasons.push(data.pages === 1 ? "1 page uses it" : `${data.pages} pages use it`);
        }
        if (data.models.length > 0) {
            reasons.push(modelsReason(data.models));
        }

        super({
            message: `Layout "${data.id}" is in use: ${reasons.join(" and ")}.`,
            data
        });
    }
}
