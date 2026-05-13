import { createImplementation } from "@webiny/feature/api";
import {
    CreateEntryDataFactory as FactoryAbstraction,
    type ICreateEntryDataFactory,
    type ICreateEntryDataResponse
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createEntryData } from "~/crud/contentEntry/entryDataFactories/createEntryData.js";
import type {
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";

class CreateEntryDataFactoryImpl implements ICreateEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly accessControl: AccessControl.Interface
    ) {}

    public create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput<TValues>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<ICreateEntryDataResponse<TValues>> {
        return createEntryData<TValues>({
            model,
            rawInput,
            options,
            context: this.cmsContext,
            getIdentity: () => this.identityContext.getIdentity(),
            getTenant: () => this.tenantContext.getTenant(),
            accessControl: this.accessControl
        });
    }
}

export const CreateEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, TenantContext, AccessControl]
});
