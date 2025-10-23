import { BaseError } from "@webiny/feature/api";

export class TeamStorageError extends BaseError {
    override readonly code = "TEAM_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message,
            data: {}
        });
    }
}

export class TeamNotFoundError extends BaseError {
    override readonly code = "TEAM_NOT_FOUND" as const;

    constructor() {
        super({
            message: `Team was not found!`,
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

export class CannotUpdatePluginTeamsError extends BaseError<void> {
    override readonly code = "CANNOT_UPDATE_PLUGIN_TEAMS" as const;

    constructor() {
        super({
            message: "Cannot update teams created via plugins.",
            data: void 0
        });
    }
}

export class CannotDeletePluginTeamsError extends BaseError<void> {
    override readonly code = "CANNOT_DELETE_PLUGIN_TEAMS" as const;

    constructor() {
        super({
            message: "Cannot delete teams created via plugins.",
            data: void 0
        });
    }
}

export class CannotUpdateSystemTeamsError extends BaseError<void> {
    override readonly code = "CANNOT_UPDATE_SYSTEM_TEAMS" as const;

    constructor() {
        super({
            message: "Cannot update system teams.",
            data: void 0
        });
    }
}

export class CannotDeleteSystemTeamsError extends BaseError<void> {
    override readonly code = "CANNOT_DELETE_SYSTEM_TEAMS" as const;

    constructor() {
        super({
            message: "Cannot delete system teams.",
            data: void 0
        });
    }
}
