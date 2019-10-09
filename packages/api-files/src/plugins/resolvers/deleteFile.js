// @flow
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/api";
import S3 from "aws-sdk/clients/s3";

const S3_BUCKET = process.env.S3_BUCKET;

export default async (root: any, args: Object, context: Object) => {
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
