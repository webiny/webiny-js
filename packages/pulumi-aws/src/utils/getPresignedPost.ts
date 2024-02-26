import { S3Client, createPresignedPost, PresignedPostOptions } from "@webiny/aws-sdk/client-s3";

interface GetPresignedPostParams {
    bucket: PresignedPostOptions["Bucket"];
    key: string;
    acl: string;
    checksum: string;
    contentType: string | null;
    cacheControl: string | undefined;
}

export const getPresignedPost = async ({
    bucket,
    key,
    acl,
    checksum,
    cacheControl,
    contentType
}: GetPresignedPostParams) => {
    const fields: Record<string, string> = { key, "X-Amz-Meta-Checksum": checksum, acl };

    if (contentType) {
        fields["Content-Type"] = contentType;
    }

    if (cacheControl) {
        fields["Cache-Control"] = cacheControl;
    }

    const s3Params = {
        Key: fields.key,
        Expires: 20,
        Bucket: bucket,
        Conditions: [
            ["content-length-range", 0, 26214400],
            { acl }
        ] as PresignedPostOptions["Conditions"],
        Fields: fields
    };

    const s3 = new S3Client();

    return createPresignedPost(s3, s3Params);
};
