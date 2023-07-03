import S3 from "aws-sdk/clients/s3";
import { Context } from "@webiny/handler/types";
import { getObjectParams } from "~/handlers/utils";
import loaders from "~/handlers/transform/loaders";
import { ObjectParamsResponse } from "~/handlers/utils/getObjectParams";
import { extractFileInformation } from "./extractFileInformation";

export function isSmallObject(object: S3.Types.GetObjectOutput) {
    return (object.ContentLength ?? Number.MIN_SAFE_INTEGER) < MAX_RETURN_CONTENT_LENGTH;
}

interface S3Object {
    object?: S3.Types.GetObjectOutput;
    params: ObjectParamsResponse;
}

export const MAX_RETURN_CONTENT_LENGTH = 5000000; // ~4.77MB

export const getS3Object = async (
    fileInfo: ReturnType<typeof extractFileInformation>,
    s3: S3,
    context: Context
): Promise<S3Object> => {
    const { filename, options, extension } = fileInfo;
    const params = getObjectParams(filename);

    const objectHead = await s3.headObject(params).promise();
    const contentLength = objectHead.ContentLength ? objectHead.ContentLength : 0;

    const applyLoaders = options.original === undefined;

    if (applyLoaders) {
        console.log("Applying loaders...");
        for (const loader of loaders) {
            try {
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
            } catch (err) {
                console.log("ERROR WHILE PROCESSING A LOADER");
                console.log(err);
            }
        }
    } else {
        console.log("Skipping loaders.");
    }

    // If no processors handled the file request, just return the S3 object taking its size into consideration.
    let object;
    if (contentLength < MAX_RETURN_CONTENT_LENGTH) {
        object = await s3.getObject(params).promise();
    }

    return { object, params };
};
