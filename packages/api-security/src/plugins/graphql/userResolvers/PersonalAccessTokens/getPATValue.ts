import { NotFoundResponse } from "@webiny/api";
import { ErrorResponse } from "@webiny/commodo-graphql";
export default async (root, args, context) => {
    if (!context.user) {
        return new NotFoundResponse("Current user not found!");
    }

    const { SecurityPersonalAccessToken } = context.models;
    const currentUserId = context.user.id;

    try {
        const pat = await SecurityPersonalAccessToken.findById(args.id);
        if (!pat) {
            return new NotFoundResponse("Personal Access Token not found!");
        }
        const patUser = await pat.user;
        if (patUser.id !== currentUserId) {
            const { fullAccess, scopes } = context.user.access;
            const canGetTokenValue =
                fullAccess || scopes.find((scope) => scope === "security:user:crud");
            if (!canGetTokenValue) {
                return new ErrorResponse({
                    message:
                        "Cannot get user's personal access token's value - insufficient permissions.",
                });
            }
        }
        const token = pat.token;
        return { data: token.slice(0, Math.ceil(token.length / 2)) };
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null,
        });
    }
};
