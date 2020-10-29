import { Response, ErrorResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        // If permission has "rwd" property set, but "w" is not part of it, bail.
        const filesFilePermission = await context.security.getPermission("files.file");
        if (filesFilePermission && !hasRwd({ filesFilePermission, rwd: "w" })) {
            return new NotAuthorizedResponse();
        }

        const { files } = context;
        const { data } = args;

        // Save file in DB.
        const file = await files.create(data);
        // Index file in "Elastic Search"
        await context.elasticSearch.create({
            id: file.id,
            index: "file-manager",
            type: "_doc",
            body: {
                id: file.id,
                createdOn: file.createdOn,
                key: file.key,
                size: file.size,
                type: file.type,
                name: file.name,
                tags: file.tags,
                createdBy: file.createdBy
            }
        });

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
