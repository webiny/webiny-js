import { S3Client, createPresignedPost, PresignedPostOptions } from "@webiny/aws-sdk/client-s3";
import { validation } from "@webiny/validation";
import { FileManagerSettings } from "@webiny/api-file-manager/types";
import { FileData, PresignedPostPayloadDataResponse } from "~/types";

const S3_BUCKET = process.env.S3_BUCKET;
const UPLOAD_MAX_FILE_SIZE_DEFAULT = 1099511627776; // 1TB

const sanitizeFileSizeValue = (value: number, defaultValue: number): number => {
    try {
        validation.validateSync(value, "required,numeric,gte:0");
        return value;
    } catch {
        // TODO @ts-refactor No need to log the error?
        return defaultValue;
    }
};

export const getPresignedPostPayload = async (
    file: FileData,
    settings: FileManagerSettings
): Promise<PresignedPostPayloadDataResponse> => {
    const uploadMinFileSize = sanitizeFileSizeValue(settings.uploadMinFileSize, 0);
    const uploadMaxFileSize = sanitizeFileSizeValue(
        settings.uploadMaxFileSize,
        UPLOAD_MAX_FILE_SIZE_DEFAULT
    );

    const params = {
        Key: file.key,
        Expires: 60,
        Bucket: S3_BUCKET as string,
        Conditions: [
            ["content-length-range", uploadMinFileSize, uploadMaxFileSize]
        ] as PresignedPostOptions["Conditions"],
        Fields: {
            "Content-Type": file.type
        }
    };

    if (params.Key.startsWith("/")) {
        params.Key = params.Key.slice(1);
    }

    const s3 = new S3Client();
    const payload = await createPresignedPost(s3, params);

    return {
        data: payload,
        file
    };
};
