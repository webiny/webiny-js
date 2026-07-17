import path from "node:path";
import { mkdir } from "node:fs/promises";
import { mdbid } from "@webiny/utils";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CreateMultiPartUploadUseCase as CreateMultiPartUploadUseCaseAbstraction } from "@webiny/api-file-manager/features/upload/CreateMultiPartUpload/index.js";
import type { CreateMultiPartUploadResult } from "@webiny/api-file-manager/features/upload/types.js";
import { createUploadToken } from "~/utils/uploadToken.js";
import { FileManagerServerConfig } from "~/features/FileManagerServerConfig/abstractions.js";

class CreateMultiPartUploadUseCaseImpl
    implements CreateMultiPartUploadUseCaseAbstraction.Interface
{
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly config: FileManagerServerConfig.Interface
    ) {}

    public async execute(
        params: CreateMultiPartUploadUseCaseAbstraction.Params
    ): Promise<CreateMultiPartUploadResult> {
        const { file, numberOfParts } = params;
        const storagePath = this.config.storagePath;
        const tenant = this.tenantContext.getTenant();
        const serverUrl = this.config.apiUrl;

        const uploadId = mdbid();

        const multipartDir = path.join(storagePath, "tenants", tenant.id, "multipart", uploadId);
        await mkdir(multipartDir, { recursive: true });

        const secret = this.config.uploadSecret;
        const expiresAt = Date.now() + 86_400_000; /* 24h */

        const parts = Array.from({ length: numberOfParts }, (_, index) => {
            const partNumber = index + 1;

            const token = createUploadToken(
                {
                    key: `tenants/${tenant.id}/multipart/${uploadId}/part-${partNumber}`,
                    tenantId: tenant.id,
                    expiresAt,
                    uploadMinFileSize: 0,
                    uploadMaxFileSize: 1_099_511_627_776
                },
                secret
            );

            const url = `${serverUrl}/webiny-file-upload/parts?uploadId=${uploadId}&partNumber=${partNumber}&token=${token}`;

            return { partNumber, url };
        });

        return { file, uploadId, parts };
    }
}

export const CreateMultiPartUploadUseCase =
    CreateMultiPartUploadUseCaseAbstraction.createImplementation({
        implementation: CreateMultiPartUploadUseCaseImpl,
        dependencies: [TenantContext, FileManagerServerConfig]
    });
