import { mkdir } from "node:fs/promises";
import { mdbid } from "@webiny/utils";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CreateMultiPartUploadUseCase as CreateMultiPartUploadUseCaseAbstraction } from "@webiny/api-file-manager/features/upload/CreateMultiPartUpload/index.js";
import type { CreateMultiPartUploadResult } from "@webiny/api-file-manager/features/upload/types.js";
import { createUploadToken } from "~/utils/uploadToken.js";
import { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { ensureNewFileId } from "~/utils/ensureNewFileId.js";
import { resolveMultipartUploadDir } from "~/utils/storagePaths.js";
import { writeMultipartUploadInfo } from "~/utils/multipartUploadInfo.js";

class CreateMultiPartUploadUseCaseImpl
    implements CreateMultiPartUploadUseCaseAbstraction.Interface
{
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly config: FileManagerStandaloneConfig.Interface,
        private readonly publicUrls: PublicUrls.Interface
    ) {}

    public async execute(
        params: CreateMultiPartUploadUseCaseAbstraction.Params
    ): Promise<CreateMultiPartUploadResult> {
        const { file, numberOfParts, clientId } = params;
        const storagePath = this.config.storagePath;
        const tenant = this.tenantContext.getTenant();
        await ensureNewFileId({ storagePath, file, tenantId: tenant.id, clientId });
        const apiUrl = await this.publicUrls.getApiUrl();

        const uploadId = mdbid();

        const multipartDir = resolveMultipartUploadDir(storagePath, tenant.id, uploadId);
        await mkdir(multipartDir, { recursive: true });

        // Security: bind the upload to its file, `CompleteMultiPartUpload` refuses any other key.
        await writeMultipartUploadInfo(multipartDir, { fileKey: file.key });

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

            const url = apiUrl.join(
                `/webiny-file-upload/parts?uploadId=${uploadId}&partNumber=${partNumber}&token=${token}`
            );

            return { partNumber, url };
        });

        return { file, uploadId, parts };
    }
}

export const CreateMultiPartUploadUseCase =
    CreateMultiPartUploadUseCaseAbstraction.createImplementation({
        implementation: CreateMultiPartUploadUseCaseImpl,
        dependencies: [TenantContext, FileManagerStandaloneConfig, PublicUrls]
    });
