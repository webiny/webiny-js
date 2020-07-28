import { NotFoundResponse } from "@webiny/graphql";
import { ErrorResponse } from "@webiny/commodo-graphql";

export default async (root, args, context) => {
    const identity = context.security.getIdentity();
    if (!identity) {
        return new NotFoundResponse("Current user not found!");
    }

    const { SecurityPersonalAccessToken } = context.models;
    const currentUserId = identity.id;

    try {
        const pat = await SecurityPersonalAccessToken.findById(args.id);
        if (!pat) {
            return new NotFoundResponse("Personal Access Token not found!");
        }

        const patUser = await pat.user;
        if (patUser.id !== currentUserId) {
            const canUpdateToken = await identity.hasScope("security:user:crud");
            if (!canUpdateToken) {
                throw new Error(
                    "Cannot get user's personal access token's value - insufficient permissions."
                );
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
