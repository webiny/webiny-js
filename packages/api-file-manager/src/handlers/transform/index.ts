import S3 from "aws-sdk/clients/s3";
import transformImage from "./transformImage";
import optimizeImage from "./optimizeImage";
import { getEnvironment, getObjectParams } from "../utils";
import * as newUtils from "./utils";
import * as legacyUtils from "./legacyUtils";
import { TransformHandlerEventPayload } from "~/handlers/types";
import { createEvent } from "@webiny/handler";

export const createTransformFilePlugins = () => {
    return [
        createEvent<TransformHandlerEventPayload>(async ({ payload }) => {
            const { body } = payload;
            const { key, transformations } = body;
            try {
                const env = getEnvironment();
                const s3 = new S3({ region: env.region });

                let optimizedImageObject: S3.Types.GetObjectOutput;

                const utils = key.includes("/") ? newUtils : legacyUtils;

                const params = {
                    initial: getObjectParams(key),
                    optimized: getObjectParams(utils.getImageKey({ key })),
                    optimizedTransformed: getObjectParams(
                        utils.getImageKey({ key, transformations })
                    )
                };

                // 1. Get optimized image.
                try {
                    optimizedImageObject = await s3.getObject(params.optimized).promise();
                } catch (e) {
                    // If not found, try to create it by loading the initially uploaded image.
                    optimizedImageObject = await s3.getObject(params.initial).promise();

                    await s3
                        .putObject({
                            ...params.optimized,
                            ContentType: optimizedImageObject.ContentType,
                            Body: await optimizeImage(
                                optimizedImageObject.Body as Buffer,
                                optimizedImageObject.ContentType as string
                            )
                        })
                        .promise();

                    optimizedImageObject = await s3.getObject(params.optimized).promise();
                }

                // 2. If no transformations requested, just exit.
                if (!transformations) {
                    return {
                        error: false,
                        message: ""
                    };
                }

                // 3. If transformations requested, apply them in save it into the bucket.
                await s3
                    .putObject({
                        ...params.optimizedTransformed,
                        ContentType: optimizedImageObject.ContentType,
                        Body: await transformImage(
                            optimizedImageObject.Body as Buffer,
                            transformations
                        )
                    })
                    .promise();

                return {
                    error: false,
                    message: ""
                };
            } catch (ex) {
                console.error(
                    JSON.stringify({
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    })
                );
                return {
                    error: true,
                    message: ex.message
                };
            }
        })
    ];
};
