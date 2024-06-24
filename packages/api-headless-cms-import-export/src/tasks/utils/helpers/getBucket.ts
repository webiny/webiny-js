export const getBucket = (): string => {
    const bucket = process.env.S3_BUCKET;
    if (
        !bucket ||
        bucket === "undefined" ||
        bucket === "null" ||
        typeof bucket !== "string" ||
        !bucket.trim()
    ) {
        throw new Error(`Missing S3_BUCKET environment variable.`);
    }
    return bucket;
};
