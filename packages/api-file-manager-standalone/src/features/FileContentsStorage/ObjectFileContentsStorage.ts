import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { FileContentsStorage } from "@webiny/api-file-manager/features/file/FileContentsStorage/index.js";
import { FileAlreadyExistsError } from "@webiny/api-file-manager/domain/file/errors.js";
import { FilePersistenceError } from "@webiny/api-file-manager/domain/file/errors.js";
import { ObjectStorage } from "~/features/ObjectStorage/abstractions.js";
import { getTenantFilesPrefix } from "~/utils/getTenantFilesPrefix.js";
import { isKeyInsidePrefix } from "~/utils/isKeyInsidePrefix.js";

const toPersistenceError = (error: unknown) => {
    return new FilePersistenceError(error instanceof Error ? error : new Error(String(error)));
};

class ObjectFileContentsStorageImpl implements FileContentsStorage.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly objectStorage: ObjectStorage.Interface
    ) {}

    async put(
        input: FileContentsStorage.PutInput
    ): Promise<Result<void, FileContentsStorage.PutError>> {
        try {
            const objectKey = this.toObjectKey(input.key);
            const stored = await this.objectStorage.putIfAbsent(objectKey, input.contents);
            if (!stored) {
                return Result.fail(new FileAlreadyExistsError({ key: input.key }));
            }
            return Result.ok();
        } catch (error) {
            return Result.fail(toPersistenceError(error));
        }
    }

    async delete(key: string): Promise<Result<void, FileContentsStorage.DeleteError>> {
        try {
            const objectKey = this.toObjectKey(key);
            await this.objectStorage.delete(objectKey);
            return Result.ok();
        } catch (error) {
            return Result.fail(toPersistenceError(error));
        }
    }

    /* The key must stay inside the current tenant's files: anything else is refused. */
    private toObjectKey(key: string): string {
        const tenant = this.tenantContext.getTenant();
        const prefix = getTenantFilesPrefix(tenant.id);
        const objectKey = `${prefix}${key}`;
        if (!isKeyInsidePrefix(objectKey, prefix)) {
            throw new Error("Refusing to access a key outside of the tenant's files.");
        }
        return objectKey;
    }
}

export const ObjectFileContentsStorage = FileContentsStorage.createImplementation({
    implementation: ObjectFileContentsStorageImpl,
    dependencies: [TenantContext, ObjectStorage]
});
