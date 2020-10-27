import { ErrorResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        // If permission has "rwd" property set, but "r" is not part of it, bail.
        const filesFilePermission = await context.security.getPermission("files.file");
        if (filesFilePermission && !hasRwd({ filesFilePermission, rwd: "r" })) {
            return new NotAuthorizedResponse();
        }

        const files = context.files;

        let list = await files.list();

        // If user can only manage own records, let's check if he owns the loaded one.
        if (filesFilePermission?.own === true) {
            const identity = context.security.getIdentity();
            list = list.filter(file => file.createdBy.id === identity.id);
        }

        return new Response(list);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
