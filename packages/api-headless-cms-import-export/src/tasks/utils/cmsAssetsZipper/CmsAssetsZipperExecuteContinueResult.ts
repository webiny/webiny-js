import { ICmsAssetsZipperExecuteContinueResult } from "./abstractions/CmsAssetsZipperExecuteContinueResult";

export class CmsAssetsZipperExecuteContinueResult implements ICmsAssetsZipperExecuteContinueResult {
    public readonly key: string;
    public readonly url: string;
    public readonly bucket: string;
    public readonly expiresOn: Date;
    public readonly entryCursor: string | undefined;
    public readonly fileCursor: string | undefined;

    public constructor(params: ICmsAssetsZipperExecuteContinueResult) {
        this.key = params.key;
        this.url = params.url;
        this.bucket = params.bucket;
        this.expiresOn = params.expiresOn;
        this.entryCursor = params.entryCursor;
        this.fileCursor = params.fileCursor;
    }
}
