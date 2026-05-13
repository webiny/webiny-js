import { createImplementation } from "@webiny/feature/api";
import {
    CreateEntryRevisionFromDataFactory as FactoryAbstraction,
    type ICreateEntryRevisionFromDataFactory,
    type ICreateEntryRevisionFromDataResponse
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createEntryRevisionFromData } from "~/crud/contentEntry/entryDataFactories/createEntryRevisionFromData.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";

class CreateEntryRevisionFromDataFactoryImpl implements ICreateEntryRevisionFromDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly accessControl: AccessControl.Interface
    ) {}

    public create<TValues extends CmsEntryValues = CmsEntryValues>(
        sourceId: string,
        model: CmsModel,
        rawInput: CreateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        latestStorageEntry: CmsEntry<TValues>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<ICreateEntryRevisionFromDataResponse<TValues>> {
        return createEntryRevisionFromData<TValues>({
            sourceId,
            model,
            rawInput,
            originalEntry,
            latestStorageEntry,
            options,
            context: this.cmsContext,
            getIdentity: () => this.identityContext.getIdentity(),
            getTenant: () => this.tenantContext.getTenant(),
            accessControl: this.accessControl
        });
    }
}

export const CreateEntryRevisionFromDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateEntryRevisionFromDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, TenantContext, AccessControl]
});
