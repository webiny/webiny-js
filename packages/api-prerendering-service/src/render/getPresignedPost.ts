import S3Client from "aws-sdk/clients/s3";

interface GetPresignedPostParams {
    bucket: string;
    key: string;
    contentType: string;
    cacheControl: string;
}

const s3 = new S3Client();

export const getPresignedPost = async ({
    bucket,
    key,
    cacheControl,
    contentType
}: GetPresignedPostParams) => {
    const s3Params = {
        Expires: 20,
        Bucket: bucket,
        Conditions: [["content-length-range", 0, 26214400]],
        Fields: {
            key,
            "Content-Type": contentType,
            "Cache-Control": cacheControl
        }
    };

    return s3.createPresignedPost(s3Params);
};
