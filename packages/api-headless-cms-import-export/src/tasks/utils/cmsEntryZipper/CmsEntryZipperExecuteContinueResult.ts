import { ICmsEntryZipperExecuteContinueResult } from "./abstractions/CmsEntryZipperExecuteContinueResult";

export class CmsEntryZipperExecuteContinueResult implements ICmsEntryZipperExecuteContinueResult {
    public readonly key: string;
    public readonly cursor: string | null;

    public constructor(params: ICmsEntryZipperExecuteContinueResult) {
        this.key = params.key;
        this.cursor = params.cursor;
    }
}
