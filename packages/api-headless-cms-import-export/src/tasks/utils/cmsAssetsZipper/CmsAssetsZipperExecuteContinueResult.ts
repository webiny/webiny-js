import type { ICmsAssetsZipperExecuteContinueResult } from "./abstractions/CmsAssetsZipperExecuteContinueResult";

export class CmsAssetsZipperExecuteContinueResult implements ICmsAssetsZipperExecuteContinueResult {
    public readonly key: string;
    public readonly checksum: string;
    public readonly entryCursor: string | undefined;
    public readonly fileCursor: string | undefined;

    public constructor(params: ICmsAssetsZipperExecuteContinueResult) {
        this.key = params.key;
        this.checksum = params.checksum;
        this.entryCursor = params.entryCursor;
        this.fileCursor = params.fileCursor;
    }
}
