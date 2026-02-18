/**
 * Helper to get error message from unknown error.
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return fallback;
};
