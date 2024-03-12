import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { IListEntries } from "../../adstractions";
import { CmsEntry, CmsEntryListParams, CmsEntryMeta, CmsEntryValues, CmsModel } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";

export class ListEntriesSecure implements IListEntries {
    private accessControl: AccessControl;
    private getIdentity: () => SecurityIdentity;
    private useCase: IListEntries;

    constructor(
        accessControl: AccessControl,
        getIdentity: () => SecurityIdentity,
        useCase: IListEntries
    ) {
        this.accessControl = accessControl;
        this.getIdentity = getIdentity;
        this.useCase = useCase;
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
        await this.accessControl.ensureCanAccessEntry({ model });
        const { where: initialWhere } = params || {};
        const where = { ...initialWhere };

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
