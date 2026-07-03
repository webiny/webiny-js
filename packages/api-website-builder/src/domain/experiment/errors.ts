import { BaseError } from "@webiny/feature/api";

export class ExperimentNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "WebsiteBuilder/Experiment/NotFound" as const;

    constructor(id: string) {
        super({
            message: "Experiment not found!",
            data: {
                id
            }
        });
    }
}

export class ExperimentPersistenceError extends BaseError {
    override readonly code = "WebsiteBuilder/Experiment/PersistenceError" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}

export class ExperimentValidationError extends BaseError {
    override readonly code = "WebsiteBuilder/Experiment/ValidationError" as const;

    constructor(message: string) {
        super({ message });
    }
}

/**
 * Raised when starting an experiment while another experiment is already running on the
 * same revision. v1 allows only one active experiment per revision.
 */
export class ExperimentAlreadyActiveError extends BaseError<{ revisionId: string }> {
    override readonly code = "WebsiteBuilder/Experiment/AlreadyActive" as const;

    constructor(revisionId: string) {
        super({
            message: "An experiment is already active on this revision.",
            data: {
                revisionId
            }
        });
    }
}

export class ExperimentNotAuthorizedError extends BaseError {
    override readonly code = "WebsiteBuilder/Experiment/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized!" });
    }
}

/** Raised when there is no active (published, running) experiment for a path or revision. */
export class NoActiveExperimentError extends BaseError<{ reference: string }> {
    override readonly code = "WebsiteBuilder/Experiment/NoActiveExperiment" as const;

    constructor(reference: string) {
        super({
            message: "No active experiment found.",
            data: { reference }
        });
    }
}

/** Raised when the active experiment is paused (kill-switch); serving falls back to the control. */
export class ExperimentPausedError extends BaseError<{ id: string }> {
    override readonly code = "WebsiteBuilder/Experiment/Paused" as const;

    constructor(id: string) {
        super({
            message: "The experiment is paused.",
            data: { id }
        });
    }
}
