import type { ICmsAssetsZipperExecuteDoneResult } from "./abstractions/CmsAssetsZipperExecuteDoneResult";

export class CmsAssetsZipperExecuteDoneResult implements ICmsAssetsZipperExecuteDoneResult {
    public readonly key: string;
    public readonly checksum: string;

    constructor(params: ICmsAssetsZipperExecuteDoneResult) {
        this.key = params.key;
        this.checksum = params.checksum;
    }
}
