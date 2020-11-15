import { ErrorResponse, Response, NotFoundResponse } from "@webiny/graphql/responses";
import S3 from "aws-sdk/clients/s3";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import hasRwd from "@webiny/api-file-manager/plugins/resolvers/utils/hasRwd";
import { NotAuthorizedResponse } from "@webiny/api-security";

const S3_BUCKET = process.env.S3_BUCKET;

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        // If permission has "rwd" property set, but "d" is not part of it, bail.
        const filesFilePermission = await context.security.getPermission("files.file");
        if (filesFilePermission && !hasRwd({ filesFilePermission, rwd: "d" })) {
            return new NotAuthorizedResponse();
        }
        const files = context.files;
        const { id } = args;

        const file = await files.get(id);
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

        const s3 = new S3();

        await s3
            .deleteObject({
                Bucket: S3_BUCKET,
                Key: file.key
            })
            .promise();
        await files.delete(id);
        // Index file in "Elastic Search"
        await context.elasticSearch.delete({
            id,
            index: "file-manager",
            type: "_doc"
        });

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
