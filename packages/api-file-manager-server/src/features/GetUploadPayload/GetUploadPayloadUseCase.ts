import { validation } from "@webiny/validation";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { Request } from "@webiny/handler/abstractions/Request.js";
import { GetUploadPayloadUseCase } from "@webiny/api-file-manager/features/upload/GetUploadPayload/index.js";
import type { FileData } from "@webiny/api-file-manager/features/upload/types.js";
import type { UploadPayloadResponse } from "@webiny/api-file-manager/features/upload/types.js";
import type { FileManagerSettings } from "@webiny/api-file-manager/domain/settings/types.js";
import { createUploadToken } from "~/utils/uploadToken.js";
import { resolveServerUrl } from "~/utils/resolveServerUrl.js";

const UPLOAD_MAX_FILE_SIZE_DEFAULT = 1099511627776; /* 1TB */

const sanitizeFileSizeValue = (value: number, defaultValue: number): number => {
    try {
        validation.validateSync(value, "required,numeric,gte:0");
        return value;
    } catch {
        return defaultValue;
    }
};

class GetUploadPayloadUseCaseImpl implements GetUploadPayloadUseCase.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly request: Request.Interface
    ) {}

    public async execute(
        file: FileData,
        settings: FileManagerSettings
    ): Promise<UploadPayloadResponse> {
        const uploadMinFileSize = sanitizeFileSizeValue(settings.uploadMinFileSize, 0);
        const uploadMaxFileSize = sanitizeFileSizeValue(
            settings.uploadMaxFileSize,
            UPLOAD_MAX_FILE_SIZE_DEFAULT
        );

        const tenant = this.tenantContext.getTenant();
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

        const serverUrl = await resolveServerUrl(this.request);

        const data = {
            url: `${serverUrl}/webiny-file-upload`,
            fields: {
                key: storageKey,
                token
            }
        };

        return {
            data: data as unknown as Record<string, unknown>,
            file
        };
    }
}

export const GetUploadPayloadUseCaseImplementation = GetUploadPayloadUseCase.createImplementation({
    implementation: GetUploadPayloadUseCaseImpl,
    dependencies: [TenantContext, Request]
});
