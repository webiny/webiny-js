import { createImplementation } from "@webiny/feature/api";
import {
    CreateRepublishEntryDataFactory as FactoryAbstraction,
    type ICreateRepublishEntryDataFactory,
    type ICreateRepublishEntryDataResponse
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createRepublishEntryData } from "~/crud/contentEntry/entryDataFactories/createRepublishEntryData.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

class CreateRepublishEntryDataFactoryImpl implements ICreateRepublishEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface
    ) {}

    public create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>
    ): Promise<ICreateRepublishEntryDataResponse<TValues>> {
        return createRepublishEntryData<TValues>({
            model,
            originalEntry,
            context: this.cmsContext,
            getIdentity: () => this.identityContext.getIdentity()
        });
    }
}

export const CreateRepublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateRepublishEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext]
});
