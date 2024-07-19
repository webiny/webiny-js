import { ICmsAssetsZipperExecuteDoneResult } from "./abstractions/CmsAssetsZipperExecuteDoneResult";

export class CmsAssetsZipperExecuteDoneResult implements ICmsAssetsZipperExecuteDoneResult {
    public readonly key: string;

    constructor(params: ICmsAssetsZipperExecuteDoneResult) {
        this.key = params.key;
    }
}
