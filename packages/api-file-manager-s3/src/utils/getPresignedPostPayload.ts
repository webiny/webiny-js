import S3 from "aws-sdk/clients/s3";
import { validation } from "@webiny/validation";
import { FileManagerSettings } from "@webiny/api-file-manager/types";
import { FileData, PresignedPostPayloadDataResponse } from "~/types";

const S3_BUCKET = process.env.S3_BUCKET;
const UPLOAD_MAX_FILE_SIZE_DEFAULT = 1099511627776; // 1TB

const sanitizeFileSizeValue = (value: number, defaultValue: number): number => {
    try {
        validation.validateSync(value, "required,numeric,gte:0");
        return value;
    } catch (e) {
        // TODO @ts-refactor No need to log the error?
        return defaultValue;
    }
};

export const getPresignedPostPayload = (
    file: FileData,
    settings: FileManagerSettings
): PresignedPostPayloadDataResponse => {
    const uploadMinFileSize = sanitizeFileSizeValue(settings.uploadMinFileSize, 0);
    const uploadMaxFileSize = sanitizeFileSizeValue(
        settings.uploadMaxFileSize,
        UPLOAD_MAX_FILE_SIZE_DEFAULT
    );

    const params = {
        Expires: 60,
        Bucket: S3_BUCKET,
        Conditions: [["content-length-range", uploadMinFileSize, uploadMaxFileSize]],
        Fields: {
            "Content-Type": file.type,
            key: file.key
        }
    };

    if (params.Fields.key.startsWith("/")) {
        params.Fields.key = params.Fields.key.slice(1);
    }

    const s3 = new S3();
    const payload = s3.createPresignedPost(params);

    return {
        data: payload,
        file
    };
};
