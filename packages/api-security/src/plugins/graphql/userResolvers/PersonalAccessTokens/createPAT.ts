import crypto from "crypto";
import { NotFoundResponse } from "@webiny/graphql";
import { ErrorResponse } from "@webiny/commodo-graphql";

const generateToken = (tokenLength = 48) =>
    crypto
        .randomBytes(Math.ceil(tokenLength / 2))
        .toString("hex")
        .slice(0, tokenLength);

export default async (root, args, context) => {
    if (!context.user) {
        return new NotFoundResponse("Current user not found!");
    }

    const PersonalAccessToken = context.models.SecurityPersonalAccessToken;
    const User = context.models.SecurityUser;

    const currentUserId = context.user.id;
    const otherUserId = args.userId;

    const canAssignUser =
        context.user.access.fullAccess ||
        context.user.access.scopes.find(scope => scope === "security:user:crud");

    try {
        let tokenUserId;
        if (!otherUserId) {
            tokenUserId = currentUserId;
        } else {
            if (!canAssignUser)
                return new ErrorResponse({
                    message:
                        "Current user is not admin! You must be an admin in order to update other users."
                });
            if (!(await User.findById(otherUserId))) {
                return new NotFoundResponse("User to be updated not found!");
            }
            tokenUserId = otherUserId;
        }

        const token = generateToken();
        const pat = new PersonalAccessToken();
        await pat
            .populate({
                user: tokenUserId,
                name: args.name,
                token
            })
            .save();
        return { data: { pat, token: pat.token } };
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
