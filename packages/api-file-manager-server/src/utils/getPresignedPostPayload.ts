import { validation } from "@webiny/validation";
import { createUploadToken } from "~/utils/uploadToken.js";
import type { FileData, PresignedPostPayloadDataResponse } from "~/types.js";
import type { FileManagerSettings } from "@webiny/api-file-manager/domain/settings/types.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

const UPLOAD_MAX_FILE_SIZE_DEFAULT = 1099511627776; /* 1TB */

const sanitizeFileSizeValue = (value: number, defaultValue: number): number => {
    try {
        validation.validateSync(value, "required,numeric,gte:0");
        return value;
    } catch {
        return defaultValue;
    }
};

export const getPresignedPostPayload = async (
    file: FileData,
    settings: FileManagerSettings,
    tenantContext: TenantContext.Interface,
    serverUrl: string
): Promise<PresignedPostPayloadDataResponse> => {
    const uploadMinFileSize = sanitizeFileSizeValue(settings.uploadMinFileSize, 0);
    const uploadMaxFileSize = sanitizeFileSizeValue(
        settings.uploadMaxFileSize,
        UPLOAD_MAX_FILE_SIZE_DEFAULT
    );

    const tenant = tenantContext.getTenant();
    const storageKey = `tenants/${tenant.id}/files/${file.key}`;

    const secret = process.env.WEBINY_UPLOAD_SECRET as string;

    const expiresAt = Date.now() + 60_000;

    const token = createUploadToken(
        {
            key: storageKey,
            tenantId: tenant.id,
            expiresAt,
            uploadMinFileSize,
            uploadMaxFileSize
        },
        secret
    );

    const data = {
        url: `${serverUrl}/webiny-file-upload`,
        fields: {
            key: storageKey,
            token
        }
    };

    return {
        data,
        file
    };
};
