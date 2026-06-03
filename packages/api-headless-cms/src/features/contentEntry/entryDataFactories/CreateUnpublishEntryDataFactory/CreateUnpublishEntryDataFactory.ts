import { createImplementation } from "@webiny/feature/api";
import {
    CreateUnpublishEntryDataFactory as FactoryAbstraction,
    type ICreateUnpublishEntryDataFactory,
    type ICreateUnpublishEntryDataResponse
} from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";
import { STATUS_UNPUBLISHED } from "../statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";

class CreateUnpublishEntryDataFactoryImpl implements ICreateUnpublishEntryDataFactory {
    public constructor(private readonly identityContext: IdentityContext.Interface) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        originalEntry: CmsEntry<TValues>
    ): Promise<ICreateUnpublishEntryDataResponse<TValues>> {
        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            status: STATUS_UNPUBLISHED,
            savedOn: getDate(currentDateTime),
            modifiedOn: getDate(currentDateTime),
            savedBy: getIdentity(currentIdentity),
            modifiedBy: getIdentity(currentIdentity),
            revisionSavedOn: getDate(currentDateTime),
            revisionModifiedOn: getDate(currentDateTime),
            revisionSavedBy: getIdentity(currentIdentity),
            revisionModifiedBy: getIdentity(currentIdentity),
            live: null
        };

        return { entry };
    }
}

export const CreateUnpublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateUnpublishEntryDataFactoryImpl,
    dependencies: [IdentityContext]
});
