import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { OBJECT_STORAGE_BUILD_PARAM } from "@webiny/api-object-storage";
import type { StandaloneConfig } from "./abstractions.js";

/**
 * Throws unless exactly one storage for uploaded files is configured: a folder
 * (`WEBINY_LOCAL_STORAGE_PATH`) or a project extension that provides one, which says so with the
 * `ObjectStorage` build param (`<S3Storage />`).
 */
export function assertFileStorage(
    fileStorage: StandaloneConfig.Interface["fileStorage"],
    buildParams: BuildParams.Interface
): void {
    const storageExtension = buildParams.get<string>(OBJECT_STORAGE_BUILD_PARAM);

    if (fileStorage.storagePath && storageExtension) {
        throw new Error(
            `WEBINY_LOCAL_STORAGE_PATH is set, but the build keeps files in "${storageExtension}" ` +
                "storage. Remove `path` from <Infra.FileStorage> and unset WEBINY_LOCAL_STORAGE_PATH."
        );
    }

    if (!fileStorage.storagePath && !storageExtension) {
        throw new Error(
            "WEBINY_LOCAL_STORAGE_PATH is not set, and no file storage extension (such as " +
                "<S3Storage />) is in the build. Set one of the two."
        );
    }
}
