import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { IGetEntry } from "../../adstractions";
import { CmsEntryGetParams, CmsModel } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";

export class GetEntrySecure implements IGetEntry {
    private accessControl: AccessControl;
    private getIdentity: () => SecurityIdentity;
    private useCase: IGetEntry;

    constructor(
        accessControl: AccessControl,
        getIdentity: () => SecurityIdentity,
        useCase: IGetEntry
    ) {
        this.accessControl = accessControl;
        this.getIdentity = getIdentity;
        this.useCase = useCase;
    }

    async execute(model: CmsModel, params: CmsEntryGetParams) {
        await this.accessControl.ensureCanAccessEntry({ model });

        const where = { ...params.where };

        /**
         * Possibly only get records which are owned by current user.
         * Or if searching for the owner set that value - in the case that user can see other entries than their own.
         */
        if (await this.accessControl.canAccessOnlyOwnedEntries({ model })) {
            where.createdBy = this.getIdentity().id;
        }

        return await this.useCase.execute(model, {
            ...params,
            where
        });
    }
}
