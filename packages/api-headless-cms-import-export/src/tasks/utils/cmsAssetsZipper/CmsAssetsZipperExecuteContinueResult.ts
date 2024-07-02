import { ICmsAssetsZipperExecuteContinueResult } from "./abstractions/CmsAssetsZipperExecuteContinueResult";

export class CmsAssetsZipperExecuteContinueResult implements ICmsAssetsZipperExecuteContinueResult {
    public readonly key: string;
    public readonly cursor: string | null;

    public constructor(params: ICmsAssetsZipperExecuteContinueResult) {
        this.key = params.key;
        this.cursor = params.cursor;
    }
}
