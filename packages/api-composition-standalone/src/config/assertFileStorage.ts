import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { OBJECT_STORAGE_BUILD_PARAM } from "@webiny/api-object-storage";

/**
 * Throws unless the build has a storage for uploaded files: a project extension that provides
 * `ObjectStorage` says so with the `ObjectStorage` build param (`<Infra.FileStorage.Disk />` sets
 * `"disk"`, `<Infra.FileStorage.S3 />` sets `"s3"`). Checked when the API starts, before any request
 * registers the extension.
 */
export function assertFileStorage(buildParams: BuildParams.Interface): void {
    const storage = buildParams.get<string>(OBJECT_STORAGE_BUILD_PARAM);
    if (!storage) {
        throw new Error(
            "No file storage is in the build. Add <Infra.FileStorage.Disk /> or " +
                "<Infra.FileStorage.S3 />."
        );
    }
}
