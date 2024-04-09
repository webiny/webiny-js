import { IDeleteEntry } from "~/crud/contentEntry/abstractions";
import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { CmsDeleteEntryOptions, CmsModel } from "~/types";

export class DeleteEntrySecure implements IDeleteEntry {
    private accessControl: AccessControl;
    private useCase: IDeleteEntry;

    constructor(accessControl: AccessControl, useCase: IDeleteEntry) {
        this.accessControl = accessControl;
        this.useCase = useCase;
    }

    async execute(model: CmsModel, id: string, options: CmsDeleteEntryOptions) {
        await this.accessControl.ensureCanAccessEntry({ model, rwd: "d" });
        await this.useCase.execute(model, id, options);
    }
}
