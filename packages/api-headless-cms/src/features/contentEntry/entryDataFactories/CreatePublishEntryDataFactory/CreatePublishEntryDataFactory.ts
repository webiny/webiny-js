import { createImplementation } from "@webiny/feature/api";
import {
    CreatePublishEntryDataFactory as FactoryAbstraction,
    type ICreatePublishEntryDataFactory,
    type ICreatePublishEntryDataResponse
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createPublishEntryData } from "~/crud/contentEntry/entryDataFactories/createPublishEntryData.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

class CreatePublishEntryDataFactoryImpl implements ICreatePublishEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface
    ) {}

    public create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>,
        latestEntry: CmsEntry<TValues>
    ): Promise<ICreatePublishEntryDataResponse<TValues>> {
        return createPublishEntryData<TValues>({
            model,
            originalEntry,
            latestEntry,
            context: this.cmsContext,
            getIdentity: () => this.identityContext.getIdentity()
        });
    }
}

export const CreatePublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreatePublishEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext]
});
