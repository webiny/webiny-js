import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CompleteMultiPartUploadUseCase as CompleteMultiPartUploadUseCaseAbstraction } from "@webiny/api-file-manager/features/upload/CompleteMultiPartUpload/index.js";
import { ObjectStorage } from "@webiny/api-object-storage";
import { toTenantFileKey } from "~/utils/toTenantFileKey.js";

class CompleteMultiPartUploadUseCaseImpl
    implements CompleteMultiPartUploadUseCaseAbstraction.Interface
{
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly objectStorage: ObjectStorage.Interface
    ) {}

    public async execute(params: CompleteMultiPartUploadUseCaseAbstraction.Params): Promise<void> {
        const { fileKey, uploadId } = params;
        const tenant = this.tenantContext.getTenant();

        const key = toTenantFileKey(tenant.id, fileKey);

        // The storage refuses an upload that was started for another key, so another tenant's too.
        await this.objectStorage.completeMultipartUpload(key, uploadId);
    }
}

export const CompleteMultiPartUploadUseCase =
    CompleteMultiPartUploadUseCaseAbstraction.createImplementation({
        implementation: CompleteMultiPartUploadUseCaseImpl,
        dependencies: [TenantContext, ObjectStorage]
    });
