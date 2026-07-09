import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { FileManagerServerConfig as FileManagerServerConfigAbstraction } from "./abstractions.js";

class FileManagerServerConfigImpl implements FileManagerServerConfigAbstraction.Interface {
    public readonly storagePath: string;
    public readonly uploadSecret: string;

    constructor(buildParams: BuildParams.Interface) {
        const storagePath = buildParams.get<string>("WEBINY_LOCAL_STORAGE_PATH");
        if (!storagePath) {
            throw new Error(
                `"WEBINY_LOCAL_STORAGE_PATH" build parameter is not defined. Please set it to a valid local path.`
            );
        }

        const uploadSecret = buildParams.get<string>("WEBINY_UPLOAD_SECRET");
        if (!uploadSecret) {
            throw new Error(
                `"WEBINY_UPLOAD_SECRET" build parameter is not defined. Please set it to a secret string used to sign upload tokens.`
            );
        }

        this.storagePath = storagePath;
        this.uploadSecret = uploadSecret;
    }
}

export const FileManagerServerConfig = FileManagerServerConfigAbstraction.createImplementation({
    implementation: FileManagerServerConfigImpl,
    dependencies: [BuildParams]
});
