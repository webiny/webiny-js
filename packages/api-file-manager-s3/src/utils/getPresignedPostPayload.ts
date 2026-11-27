import type { PresignedPostOptions } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client, createPresignedPost, createS3 } from "@webiny/aws-sdk/client-s3/index.js";
import { validation } from "@webiny/validation";
import type { FileData, PresignedPostPayloadDataResponse } from "~/types.js";
import type { FileManagerSettings } from "@webiny/api-file-manager/domain/settings/types.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { getFileStorageKey } from "./getFileStorageKey.js";
import { ensureNewFileId } from "./ensureNewFileId.js";

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
    settings: FileManagerSettings,
    tenantContext: TenantContext.Interface,
    options: {
        /**
         * The file id, when it was provided by the client (not generated on the server).
         */
        clientId?: string;
    } = {}
): Promise<PresignedPostPayloadDataResponse> => {
    const uploadMinFileSize = sanitizeFileSizeValue(settings.uploadMinFileSize, 0);
    const uploadMaxFileSize = sanitizeFileSizeValue(
        settings.uploadMaxFileSize,
        UPLOAD_MAX_FILE_SIZE_DEFAULT
    );

    const tenant = tenantContext.getTenant();
    await ensureNewFileId({
        s3: createS3(),
        bucket: S3_BUCKET as string,
        file,
        tenantId: tenant.id,
        clientId: options.clientId
    });

    const storageKey = getFileStorageKey(tenant.id, file.key);

    const params = {
        Key: storageKey,
        Expires: 60,
        Bucket: S3_BUCKET as string,
        Conditions: [
            ["content-length-range", uploadMinFileSize, uploadMaxFileSize]
        ] as PresignedPostOptions["Conditions"],
        Fields: {
            "Content-Type": file.type
        }
    };

    const s3 = new S3Client();
    const payload = await createPresignedPost(s3, params);

    return {
        data: payload,
        file
    };
};
