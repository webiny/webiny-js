import Error from "@webiny/error";

export class NotAuthorizedError extends Error {
    constructor(data: Record<string, any>) {
        super({
            code: "NOT_AUTHORISED",
            message: `Not a reviewer, couldn't provide sign-off.`,
            data: data || null
        });
    }
}

export class StepMissingError extends Error {
    constructor(data: Record<string, any>) {
        super({
            code: "MISSING_STEP",
            message: `Please complete previous steps first.`,
            data: data || null
        });
    }
}

export class PendingChangeRequestsError extends Error {
    constructor(data: Record<string, any>) {
        super({
            code: "PENDING_CHANGE_REQUESTS",
            message: `Change requests are pending couldn't provide sign-off.`,
            data: data || null
        });
    }
}

export class StepInActiveError extends Error {
    constructor(data: Record<string, any>) {
        super({
            code: "STEP_NOT_ACTIVE",
            message: `Step needs to be in active state before providing sign-off.`,
            data: data || null
        });
    }
}

export class NoSignOffProvidedError extends Error {
    constructor(data: Record<string, any>) {
        super({
            code: "NO_SIGN_OFF_PROVIDED",
            message: `Sign-off must be provided in order for it to be retracted.`,
            data: data || null
        });
    }
}
