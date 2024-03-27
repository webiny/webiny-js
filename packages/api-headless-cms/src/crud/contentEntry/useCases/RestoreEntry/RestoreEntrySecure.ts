import { IRestoreEntry } from "~/crud/contentEntry/abstractions";
import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { CmsModel } from "~/types";

export class RestoreEntrySecure implements IRestoreEntry {
    private accessControl: AccessControl;
    private useCase: IRestoreEntry;

    constructor(accessControl: AccessControl, useCase: IRestoreEntry) {
        this.accessControl = accessControl;
        this.useCase = useCase;
    }

    async execute(model: CmsModel, id: string) {
        await this.accessControl.ensureCanAccessEntry({ model, rwd: "d" });
        return await this.useCase.execute(model, id);
    }
}
