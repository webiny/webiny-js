import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CreateMultiPartUploadUseCase as CreateMultiPartUploadUseCaseAbstraction } from "@webiny/api-file-manager/features/upload/CreateMultiPartUpload/index.js";
import type { CreateMultiPartUploadResult } from "@webiny/api-file-manager/features/upload/types.js";
import { createUploadToken } from "~/utils/uploadToken.js";
import { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { ObjectStorage } from "@webiny/api-object-storage";
import { toTenantFileKey } from "~/utils/toTenantFileKey.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";

class CreateMultiPartUploadUseCaseImpl
    implements CreateMultiPartUploadUseCaseAbstraction.Interface
{
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly config: FileManagerStandaloneConfig.Interface,
        private readonly publicUrls: PublicUrls.Interface,
        private readonly objectStorage: ObjectStorage.Interface
    ) {}

    public async execute(
        params: CreateMultiPartUploadUseCaseAbstraction.Params
    ): Promise<CreateMultiPartUploadResult> {
        const { file, numberOfParts } = params;
        const tenant = this.tenantContext.getTenant();
        const apiUrl = await this.publicUrls.getApiUrl();

        const key = toTenantFileKey(tenant.id, file.key);

        const uploadId = await this.objectStorage.createMultipartUpload(key);

        const secret = this.config.uploadSecret;
        const expiresAt = Date.now() + 86_400_000; /* 24h */

        const parts = Array.from({ length: numberOfParts }, (_, index) => {
            const partNumber = index + 1;

            const token = createUploadToken(
                {
                    key,
                    tenantId: tenant.id,
                    expiresAt,
                    uploadMinFileSize: 0,
                    uploadMaxFileSize: 1_099_511_627_776,
                    multipart: { uploadId, partNumber }
                },
                secret
            );

            // S3 upload IDs can hold characters a query string can't.
            const encodedUploadId = encodeURIComponent(uploadId);
            const url = apiUrl.join(
                `/webiny-file-upload/parts?uploadId=${encodedUploadId}&partNumber=${partNumber}&token=${token}`
            );

            return { partNumber, url };
        });

        return { file, uploadId, parts };
    }
}

export const CreateMultiPartUploadUseCase =
    CreateMultiPartUploadUseCaseAbstraction.createImplementation({
        implementation: CreateMultiPartUploadUseCaseImpl,
        dependencies: [TenantContext, FileManagerStandaloneConfig, PublicUrls, ObjectStorage]
    });
