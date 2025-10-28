import { BaseError } from "@webiny/feature/api";

export class TeamStorageError extends BaseError {
    override readonly code = "TEAM_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class TeamNotFoundError extends BaseError {
    override readonly code = "TEAM_NOT_FOUND" as const;

    constructor() {
        super({
            message: `Team was not found!`
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

type TeamExistsErrorData = {
    slug: string;
};

export class TeamExistsError extends BaseError<TeamExistsErrorData> {
    override readonly code = "TEAM_EXISTS" as const;

    constructor(slug: string) {
        super({
            message: `Team with slug "${slug}" already exists.`,
            data: { slug }
        });
    }
}

export class CannotUpdatePluginTeamsError extends BaseError {
    override readonly code = "CANNOT_UPDATE_PLUGIN_TEAMS" as const;

    constructor() {
        super({
            message: "Cannot update teams created via plugins."
        });
    }
}

export class CannotDeletePluginTeamsError extends BaseError {
    override readonly code = "CANNOT_DELETE_PLUGIN_TEAMS" as const;

    constructor() {
        super({
            message: "Cannot delete teams created via plugins."
        });
    }
}

export class CannotUpdateSystemTeamsError extends BaseError {
    override readonly code = "CANNOT_UPDATE_SYSTEM_TEAMS" as const;

    constructor() {
        super({
            message: "Cannot update system teams."
        });
    }
}

export class CannotDeleteSystemTeamsError extends BaseError {
    override readonly code = "CANNOT_DELETE_SYSTEM_TEAMS" as const;

    constructor() {
        super({
            message: "Cannot delete system teams."
        });
    }
}

type TeamValidationErrorData = {
    message: string;
};

export class TeamValidationError extends BaseError<TeamValidationErrorData> {
    override readonly code = "TEAM_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}
