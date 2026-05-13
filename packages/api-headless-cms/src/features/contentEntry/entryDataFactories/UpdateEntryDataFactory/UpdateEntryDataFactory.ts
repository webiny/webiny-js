import { createImplementation } from "@webiny/feature/api";
import {
    UpdateEntryDataFactory as FactoryAbstraction,
    type IUpdateEntryDataFactory,
    type IUpdateEntryDataResponse
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createUpdateEntryData } from "~/crud/contentEntry/entryDataFactories/createUpdateEntryData.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";

class UpdateEntryDataFactoryImpl implements IUpdateEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    public create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: UpdateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        options?: UpdateCmsEntryOptionsInput,
        metaInput?: Record<string, any>
    ): Promise<IUpdateEntryDataResponse<TValues>> {
        return createUpdateEntryData<TValues>({
            model,
            rawInput,
            originalEntry,
            options,
            metaInput,
            context: this.cmsContext,
            getIdentity: () => this.identityContext.getIdentity(),
            getTenant: () => this.tenantContext.getTenant()
        });
    }
}

export const UpdateEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: UpdateEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, TenantContext]
});
