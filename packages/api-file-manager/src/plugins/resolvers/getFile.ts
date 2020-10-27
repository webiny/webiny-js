import { Response, ErrorResponse, NotFoundResponse } from "@webiny/graphql";
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
        const { files } = context;

        const file = await files.get(args.id);
        if (!file) {
            return new NotFoundResponse(`File with id "${args.id}" does not exists.`);
        }

        // If user can only manage own records, let's check if he owns the loaded one.
        if (filesFilePermission?.own === true) {
            const identity = context.security.getIdentity();
            if (file.createdBy.id !== identity.id) {
                return new NotAuthorizedResponse();
            }
        }

        return new Response({ ...file, id: file.SK });
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
