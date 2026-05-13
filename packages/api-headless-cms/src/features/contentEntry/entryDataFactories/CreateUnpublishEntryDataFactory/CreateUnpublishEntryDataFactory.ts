import { createImplementation } from "@webiny/feature/api";
import {
    CreateUnpublishEntryDataFactory as FactoryAbstraction,
    type ICreateUnpublishEntryDataFactory,
    type ICreateUnpublishEntryDataResponse
} from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createUnpublishEntryData } from "~/crud/contentEntry/entryDataFactories/createUnpublishEntryData.js";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";

class CreateUnpublishEntryDataFactoryImpl implements ICreateUnpublishEntryDataFactory {
    public constructor(private readonly identityContext: IdentityContext.Interface) {}

    public create<TValues extends CmsEntryValues = CmsEntryValues>(
        originalEntry: CmsEntry<TValues>
    ): Promise<ICreateUnpublishEntryDataResponse<TValues>> {
        return createUnpublishEntryData<TValues>({
            originalEntry,
            getIdentity: () => this.identityContext.getIdentity()
        });
    }
}

export const CreateUnpublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateUnpublishEntryDataFactoryImpl,
    dependencies: [IdentityContext]
});
