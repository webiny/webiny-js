export interface AdminUsersErrorParams {
    code?: string | null;
    message: string;
    data?: Record<string, any> | null;
}

/**
 * An error the Admin Users API returned, with its code, so callers can tell errors apart.
 */
export class AdminUsersError extends Error {
    public readonly code: string;
    public readonly data: Record<string, any>;

    constructor(params: AdminUsersErrorParams) {
        super(params.message);
        this.name = "AdminUsersError";
        this.code = params.code ?? "";
        this.data = params.data ?? {};
    }
}
