import type { ICmsAssetsZipperExecuteContinueWithoutResult } from "./abstractions/CmsAssetsZipperExecuteContinueWithoutResult";

export class CmsAssetsZipperExecuteContinueWithoutResult
    implements ICmsAssetsZipperExecuteContinueWithoutResult
{
    public readonly entryCursor: string | undefined;
    public readonly fileCursor: string | undefined;

    public constructor(params: ICmsAssetsZipperExecuteContinueWithoutResult) {
        this.entryCursor = params.entryCursor;
        this.fileCursor = params.fileCursor;
    }
}
