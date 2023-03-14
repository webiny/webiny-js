import S3 from "aws-sdk/clients/s3";
import { Context } from "@webiny/handler/types";
import { getObjectParams } from "~/handlers/utils";
import loaders from "~/handlers/transform/loaders";
import { ObjectParamsResponse } from "~/handlers/utils/getObjectParams";
import { extractFileInformation } from "./extractFileInformation";

interface S3Object {
    object?: S3.Types.GetObjectOutput;
    params: ObjectParamsResponse;
}

const MAX_RETURN_CONTENT_LENGTH = 5000000; // ~4.77MB

export const getS3Object = async (
    fileInfo: ReturnType<typeof extractFileInformation>,
    s3: S3,
    context: Context
): Promise<S3Object> => {
    const { filename, options, extension } = fileInfo;
    const params = getObjectParams(filename);

    const objectHead = await s3.headObject(params).promise();
    const contentLength = objectHead.ContentLength ? objectHead.ContentLength : 0;

    for (const loader of loaders) {
        const canProcess = loader.canProcess({
            context,
            s3,
            options,
            file: {
                name: filename,
                extension,
                contentLength
            }
        });

        if (!canProcess) {
            continue;
        }
        return loader.process({
            context,
            s3,
            options,
            file: {
                name: filename,
                extension,
                contentLength
            }
        });
    }

    // If no processors handled the file request, just return the S3 object taking its size into consideration.
    let object;
    if (contentLength < MAX_RETURN_CONTENT_LENGTH) {
        object = await s3.getObject(params).promise();
    }

    return { object, params };
};
