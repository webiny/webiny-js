import type { ICmsEntryZipperExecuteDoneResult } from "./abstractions/CmsEntryZipperExecuteDoneResult";

export class CmsEntryZipperExecuteDoneResult implements ICmsEntryZipperExecuteDoneResult {
    public readonly key: string;
    public readonly checksum: string;

    constructor(params: ICmsEntryZipperExecuteDoneResult) {
        this.key = params.key;
        this.checksum = params.checksum;
    }
}
