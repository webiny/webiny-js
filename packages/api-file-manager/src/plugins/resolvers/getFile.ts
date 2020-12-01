import { Response, ErrorResponse, NotFoundResponse } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";
import { FileManagerResolverContext } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context: FileManagerResolverContext) => {
    try {
        // If permission has "rwd" property set, but "r" is not part of it, bail.
        const filesFilePermission = await context.security.getPermission("fm.file");
        if (filesFilePermission && !hasRwd({ filesFilePermission, rwd: "r" })) {
            return new NotAuthorizedResponse();
        }
        const { files } = context.fileManager;

        const file = await files.getFile(args.id);
        if (!file) {
            return new NotFoundResponse(`File with id "${args.id}" does not exists.`);
        }

        // If user can only manage own records, let's check if he owns the loaded one.
        if (filesFilePermission.own === true) {
            const identity = context.security.getIdentity();
            if (file.createdBy.id !== identity.id) {
                return new NotAuthorizedResponse();
            }
        }

        return new Response(file);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
