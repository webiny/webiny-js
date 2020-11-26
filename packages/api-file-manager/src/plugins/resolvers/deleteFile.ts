import { ErrorResponse, Response, NotFoundResponse } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import hasRwd from "@webiny/api-file-manager/plugins/resolvers/utils/hasRwd";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { FileManagerResolverContext } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context: FileManagerResolverContext) => {
    try {
        // If permission has "rwd" property set, but "d" is not part of it, bail.
        const filesFilePermission = await context.security.getPermission("fm.file");
        if (filesFilePermission && !hasRwd({ filesFilePermission, rwd: "d" })) {
            return new NotAuthorizedResponse();
        }
        const { files } = context.fileManager;
        const { id } = args;

        const file = await files.getFile(id);
        if (!file) {
            return new NotFoundResponse(id ? `File "${id}" not found!` : "File not found!");
        }

        // If user can only manage own records, let's check if he owns the loaded one.
        if (filesFilePermission?.own === true) {
            const identity = context.security.getIdentity();
            if (file.createdBy.id !== identity.id) {
                return new NotAuthorizedResponse();
            }
        }

        await context.fileManager.storage.delete({ id: file.id, key: file.key });

        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
