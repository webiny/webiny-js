import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";
import { FileManagerResolverContext } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context: FileManagerResolverContext) => {
    try {
        // If permission has "rwd" property set, but "w" is not part of it, bail.
        const filesFilePermission = await context.security.getPermission("fm.file");
        if (filesFilePermission && !hasRwd({ filesFilePermission, rwd: "w" })) {
            return new NotAuthorizedResponse();
        }

        const { files } = context.fileManager;
        const { data } = args;

        const file = await files.createFile(data);

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
