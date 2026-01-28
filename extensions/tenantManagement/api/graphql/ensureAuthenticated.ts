import type { Context } from "../types";

export const ensureAuthenticated = (context: Context) => {
    if (!context.security.getIdentity()) {
        throw new Error("You're not authorized to perform this action!");
    }
};
