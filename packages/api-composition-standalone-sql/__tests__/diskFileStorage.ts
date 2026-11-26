import { createRegisterBuildParamPlugin, createRegisterExtensionPlugin } from "@webiny/handler";
import { BuildParam } from "@webiny/api-core/features/buildParams/abstractions.js";
import { OBJECT_STORAGE_BUILD_PARAM } from "@webiny/api-object-storage";
import { DiskStorageExtension } from "@webiny/api-object-storage-disk";

class DiskObjectStorageBuildParam implements BuildParam.Interface {
    key = OBJECT_STORAGE_BUILD_PARAM;
    value = "disk";
}

const DiskObjectStorage = BuildParam.createImplementation({
    implementation: DiskObjectStorageBuildParam,
    dependencies: []
});

/**
 * Mirrors what `<Infra.FileStorage.Disk>` generates into `extensions.ts`: the build param that tells
 * the server a file storage is in the build, and the extension that registers it. The folder comes
 * from `WEBINY_LOCAL_STORAGE_PATH`, which the server helpers set.
 */
export const diskFileStorage = [
    createRegisterBuildParamPlugin(ctx => {
        ctx.container.register(DiskObjectStorage);
    }),
    createRegisterExtensionPlugin(ctx => {
        DiskStorageExtension.register(ctx.container);
    })
];
