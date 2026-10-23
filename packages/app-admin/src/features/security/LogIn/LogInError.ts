export interface LogInErrorParams {
    code?: string | null;
    message: string;
    data?: Record<string, any> | null;
}

/**
 * A failed `security.login`: either the error the API returned, or the request's own failure
 * (for example, the tenant in the `x-tenant` header couldn't be loaded).
 */
export class LogInError extends Error {
    public readonly code: string;
    public readonly data: Record<string, any>;

    constructor(params: LogInErrorParams) {
        super(params.message);
        this.name = "LogInError";
        this.code = params.code ?? "";
        this.data = params.data ?? {};
    }

    static from(error: unknown): LogInError {
        if (error instanceof LogInError) {
            return error;
        }

        if (error && typeof error === "object") {
            const { code, message, data } = error as Partial<LogInErrorParams>;
            return new LogInError({
                code,
                message: message || "Login failed.",
                data
            });
        }

        return new LogInError({ message: String(error) });
    }
}
