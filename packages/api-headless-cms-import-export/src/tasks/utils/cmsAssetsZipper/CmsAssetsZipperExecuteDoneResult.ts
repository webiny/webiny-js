import { ICmsAssetsZipperExecuteDoneResult } from "./abstractions/CmsAssetsZipperExecuteDoneResult";

export class CmsAssetsZipperExecuteDoneResult implements ICmsAssetsZipperExecuteDoneResult {
    public readonly key: string;
    public readonly url: string;
    public readonly bucket: string;
    public readonly expiresOn: Date;

    constructor(params: ICmsAssetsZipperExecuteDoneResult) {
        this.key = params.key;
        this.url = params.url;
        this.bucket = params.bucket;
        this.expiresOn = params.expiresOn;
    }
}
