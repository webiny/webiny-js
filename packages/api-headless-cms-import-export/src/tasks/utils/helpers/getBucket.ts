import { WebinyError } from "@webiny/error";

export const getBucket = (): string => {
    const bucket = process.env.S3_BUCKET;
    if (
        !bucket ||
        bucket === "undefined" ||
        bucket === "null" ||
        typeof bucket !== "string" ||
        !bucket.trim()
    ) {
        throw new WebinyError(`Missing S3_BUCKET environment variable.`, "S3_BUCKET_ERROR");
    }
    return bucket;
};
