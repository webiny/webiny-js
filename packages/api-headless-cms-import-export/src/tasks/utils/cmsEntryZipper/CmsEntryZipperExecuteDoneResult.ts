import { ICmsEntryZipperExecuteDoneResult } from "./abstractions/CmsEntryZipperExecuteDoneResult";

export class CmsEntryZipperExecuteDoneResult implements ICmsEntryZipperExecuteDoneResult {
    public readonly key: string;
    public readonly url: string;
    public readonly bucket: string;
    public readonly expiresOn: Date;

    constructor(params: ICmsEntryZipperExecuteDoneResult) {
        this.key = params.key;
        this.url = params.url;
        this.bucket = params.bucket;
        this.expiresOn = params.expiresOn;
    }
}
