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
            const canUpdateToken =
                fullAccess || scopes.find(scope => scope === "security:user:crud");
            if (!canUpdateToken) {
                return new ErrorResponse({
                    message:
                        "Cannot get user's personal access token's value - insufficient permissions."
                });
            }
        }
        await pat.populate(args.data).save();
        return { data: pat };
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
