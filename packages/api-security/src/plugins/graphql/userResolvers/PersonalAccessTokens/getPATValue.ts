import { NotFoundResponse, ErrorResponse } from "@webiny/commodo-graphql";

export default async (root, args, context) => {
    const PersonalAccessToken = context.models.SecurityPersonalAccessToken;
    const User = context.models.SecurityUser;

    const currentUserId = context.user.id;
    const currentUser = await User.findById(currentUserId);

    const canAssignUser =
        context.user.access.fullAccess ||
        context.user.access.scopes.find((scope) => scope === "security:user:crud");

    try {
        const PAT = await PersonalAccessToken.findById(args.id);
        if (!PAT) return new NotFoundResponse("PAT not found!");
        const PATUser = await PAT.user;

        if (PATUser.id === currentUserId) {
            if (!currentUser) return new NotFoundResponse("Current user not found!");
        } else {
            if (!canAssignUser)
                return new ErrorResponse({
                    message:
                        "Current user is not admin! You must be an admin in order to update other users.",
                });
        }

        console.log("");
        console.log("");
        console.log(PAT);
        const token = PAT.token;
        return token.slice(0, Math.ceil(token.length / 2));
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null,
        });
    }
};
