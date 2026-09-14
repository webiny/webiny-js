import { existsSync, mkdirSync } from "node:fs";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { RequestOrigin } from "@webiny/api-core/features/requestContext/index.js";
import { FileManagerServerConfig as FileManagerServerConfigAbstraction } from "./abstractions.js";

class FileManagerServerConfigImpl implements FileManagerServerConfigAbstraction.Interface {
    public readonly storagePath: string;
    public readonly uploadSecret: string;
    public readonly apiUrl: string;

    constructor(buildParams: BuildParams.Interface, requestOrigin: RequestOrigin.Interface) {
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

        // The API's own public origin, used to build client-reachable URLs (upload endpoint + file
        // srcPrefix). A build param (baked by Infra.ApiUrl), NOT a process.env read in api runtime code.
        //
        // Falls back to the origin the current request came through, which is what makes this work
        // behind a proxy whose address isn't knowable at build time — a dev proxy on whatever port
        // was free, or a portless domain. A configured value still wins: someone who pinned the
        // origin means it, and forwarded headers are client input.
        const apiUrl = buildParams.get<string>("WEBINY_API_URL") || requestOrigin.get();
        if (!apiUrl) {
            throw new Error(
                `"WEBINY_API_URL" build parameter is not defined, and the request carried no origin to fall back on. Configure it via <Infra.ApiUrl url="..." /> in webiny.config.`
            );
        }

        this.storagePath = storagePath;
        this.uploadSecret = uploadSecret;
        this.apiUrl = apiUrl.replace(/\/+$/, "");

        // Ensure the storage directory exists. Done here (on first resolve, at request time) rather
        // than in FileManagerServerFeature.register(): build params like WEBINY_LOCAL_STORAGE_PATH are
        // only registered once project extensions are applied, which happens LATER in the request
        // stack than the file-manager transport hook — so resolving this config at register() time
        // would read the param before it exists and throw.
        if (!existsSync(this.storagePath)) {
            mkdirSync(this.storagePath, { recursive: true });
        }
    }
}

export const FileManagerServerConfig = FileManagerServerConfigAbstraction.createImplementation({
    implementation: FileManagerServerConfigImpl,
    dependencies: [BuildParams, RequestOrigin]
});
