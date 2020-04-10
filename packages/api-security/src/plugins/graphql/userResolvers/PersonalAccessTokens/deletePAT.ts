import { NotFoundResponse } from "@webiny/graphql";
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
            const canDeleteToken =
                fullAccess || scopes.find((scope) => scope === "security:user:crud");
            if (!canDeleteToken) {
                return new ErrorResponse({
                    message:
                        "Cannot delete user's personal access token - insufficient permissions.",
                });
            }
        }
        await pat.delete();
        return { data: true };
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null,
        });
    }
};
