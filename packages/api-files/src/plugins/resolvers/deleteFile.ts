import { ErrorResponse, Response, NotFoundResponse } from "@webiny/graphql";
import S3 from "aws-sdk/clients/s3";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const S3_BUCKET = process.env.S3_BUCKET;

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { File } = context.models;
    const { id } = args;

    const file = await File.findById(id);
    // Logic for particular permission/resolver
    // We can move it somewhere else and pass it to "hasScope" like CMS
    const identity = context.security.getIdentity();
    // Because check permission passed, we know this permission exist
    const permission = await context.security.getPermission("files.file.delete");

    if (permission.own && file.createdBy !== identity.id) {
        return new ErrorResponse({
            message: "Not authorized! Missing permission required for the operation!",
            code: "SECURITY_NOT_AUTHORIZED",
            data: { permission }
        });
    }

    if (!file) {
        return new NotFoundResponse(id ? `File "${id}" not found!` : "File not found!");
    }

    const s3 = new S3();

    await s3
        .deleteObject({
            Bucket: S3_BUCKET,
            Key: file.key
        })
        .promise();

    return file
        .delete()
        .then(() => new Response(true))
        .catch(
            e =>
                new ErrorResponse({
                    code: e.code,
                    message: e.message
                })
        );
};

export default resolver;
