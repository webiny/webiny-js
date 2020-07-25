import crypto from "crypto";
import { NotFoundResponse } from "@webiny/graphql";
import { ErrorResponse } from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security/utils";

const generateToken = (tokenLength = 48) =>
    crypto
        .randomBytes(Math.ceil(tokenLength / 2))
        .toString("hex")
        .slice(0, tokenLength);

export default async (root, args, context) => {
    const identity = context.security.getIdentity();
    if (!identity) {
        return new NotFoundResponse("Current user not found!");
    }

    const { SecurityPersonalAccessToken, SecurityUser } = context.models;

    const otherUserId = args.userId;

    try {
        let tokenUserId;
        if (!otherUserId) {
            tokenUserId = identity.id;
        } else {
            // TODO: Won't work because on all solutions, fix this.
            const canAssignUser = hasScope("security:user:crud", identity.scopes);
            if (!canAssignUser) {
                return new ErrorResponse({
                    message:
                        "Current user is not admin! You must be an admin in order to update other users."
                });
            }

            if (!(await SecurityUser.findById(otherUserId))) {
                return new NotFoundResponse("User to be updated not found!");
            }
            tokenUserId = otherUserId;
        }

        const token = generateToken();
        const pat = new SecurityPersonalAccessToken();
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
