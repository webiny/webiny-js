import { ICmsEntryZipperExecuteDoneResult } from "./abstractions/CmsEntryZipperExecuteDoneResult";

export class CmsEntryZipperExecuteDoneResult implements ICmsEntryZipperExecuteDoneResult {
    public readonly key: string;

    constructor(params: ICmsEntryZipperExecuteDoneResult) {
        this.key = params.key;
    }
}
