import { ErrorResponse, Response, NotFoundResponse } from "@webiny/graphql";
import S3 from "aws-sdk/clients/s3";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const S3_BUCKET = process.env.S3_BUCKET;

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { File } = context.models;
    const { id } = args;

    const file = await File.findById(id);
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
