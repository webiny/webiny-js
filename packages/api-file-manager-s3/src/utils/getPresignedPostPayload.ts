// @ts-ignore `mdbid` has no type declarations
import mdbid from "mdbid";
import sanitizeFilename from "sanitize-filename";
import S3 from "aws-sdk/clients/s3";
import { validation } from "@webiny/validation";
import { PresignedPostPayloadData, PresignedPostPayloadDataResponse } from "~/types";
import { FileManagerSettings } from "@webiny/api-file-manager/types";
import { mimeTypes } from "./mimeTypes";

const S3_BUCKET = process.env.S3_BUCKET;
const UPLOAD_MAX_FILE_SIZE_DEFAULT = 26214400; // 25MB

const sanitizeFileSizeValue = (value: number, defaultValue: number): number => {
    try {
        validation.validateSync(value, "required,numeric,gte:0");
        return value;
    } catch (e) {
        // TODO @ts-refactor No need to log the error?
        return defaultValue;
    }
};

export const getPresignedPostPayload = async (
    data: PresignedPostPayloadData,
    settings: FileManagerSettings
): Promise<PresignedPostPayloadDataResponse> => {
    // If type is missing, let's use the default "application/octet-stream" type,
    // which is also the default type that the Amazon S3 would use.
    if (!data.type) {
        data.type = "application/octet-stream";
    }

    const contentType = data.type;
    if (!contentType) {
        throw Error(`File's content type could not be resolved.`);
    }

    const id = mdbid();
    let key = sanitizeFilename(data.name);
    if (key) {
        key = id + "/" + key;
    }

    if (data.keyPrefix) {
        key = `${sanitizeFilename(data.keyPrefix)}${key}`;
    }

    // Replace all whitespace.
    key = key.replace(/\s/g, "");

    // Make sure file key contains a file extension
    const extensions = mimeTypes[contentType];
    if (!extensions.some(ext => key.endsWith(`.${ext}`))) {
        key = key + `.${extensions[0]}`;
    }

    const uploadMinFileSize = sanitizeFileSizeValue(settings.uploadMinFileSize, 0);
    const uploadMaxFileSize = sanitizeFileSizeValue(
        settings.uploadMaxFileSize,
        UPLOAD_MAX_FILE_SIZE_DEFAULT
    );

    const params = {
        Expires: 60,
        Bucket: S3_BUCKET,
        Conditions: [["content-length-range", uploadMinFileSize, uploadMaxFileSize]], // 0 Bytes - 25MB
        Fields: {
            "Content-Type": contentType,
            key
        }
    };

    if (params.Fields.key.startsWith("/")) {
        params.Fields.key = params.Fields.key.slice(1);
    }

    const s3 = new S3();
    const payload = s3.createPresignedPost(params);

    return {
        data: payload,
        file: {
            id,
            name: data.name,
            key,
            type: contentType,
            size: data.size
        }
    };
};
