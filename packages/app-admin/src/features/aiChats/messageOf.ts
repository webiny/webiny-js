/** An error's message, for showing it to the user. Anything thrown that is not an `Error` is stringified. */
export const messageOf = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};
