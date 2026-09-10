import WebinyError from "@webiny/error";
import { createIdentifier, mdbid } from "@webiny/utils";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { cleanInputValues } from "~/features/contentEntry/entryDataFactories/cleanInputValues.js";
import { EntryDataProcessor } from "~/features/contentEntry/entryDataProcessor/index.js";
import { getDate } from "~/utils/date.js";
import { getIdentity } from "~/utils/identity.js";
import {
    SIMPLE_ENTRY_EXPIRES_AT,
    SIMPLE_ENTRY_LOCKED,
    SIMPLE_ENTRY_STATUS,
    SIMPLE_ENTRY_VERSION
} from "~/features/simpleContentEntries/constants.js";
import type {
    ICreateSimpleEntryInput,
    ISimpleCmsEntry
} from "~/features/simpleContentEntries/types.js";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import { CreateSimpleEntryDataFactory as FactoryAbstraction } from "./abstractions/index.js";

const ID_PATTERN = /^([a-zA-Z0-9])([a-zA-Z0-9-]+)([a-zA-Z0-9])$/;

class CreateSimpleEntryDataFactoryImpl implements FactoryAbstraction.Interface {
    public constructor(
        private readonly entryDataProcessor: EntryDataProcessor.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: ICreateSimpleEntryInput<TValues>
    ): Promise<FactoryAbstraction.Response<TValues>> {
        const initialValues = cleanInputValues<TValues>(model, rawInput.values || ({} as TValues));

        await this.entryDataProcessor.validateOrThrow<TValues>({
            model,
            values: initialValues
        });

        const values = await this.entryDataProcessor.mapReferenceFields<TValues>({
            model,
            values: initialValues,
            validateEntries: true
        });

        const entryId = this.createEntryId(rawInput.id);

        const entry: ISimpleCmsEntry<TValues> = {
            id: createIdentifier({
                id: entryId,
                version: SIMPLE_ENTRY_VERSION
            }),
            entryId,
            tenant: this.tenantContext.getTenant().id,
            modelId: model.modelId,
            createdOn: getDate<string>(undefined, new Date()),
            createdBy: getIdentity(this.identityContext.getIdentity()),
            values,
            version: SIMPLE_ENTRY_VERSION,
            status: SIMPLE_ENTRY_STATUS,
            locked: SIMPLE_ENTRY_LOCKED,
            expiresAt: SIMPLE_ENTRY_EXPIRES_AT
        };

        return {
            entry,
            input: rawInput
        };
    }

    private createEntryId(id?: string): string {
        if (!id) {
            return mdbid();
        }
        if (id.match(ID_PATTERN) === null) {
            throw new WebinyError(
                "The provided ID is not valid. It must be a string which can be A-Z, a-z, 0-9, - and it cannot start or end with a -.",
                "INVALID_ID",
                {
                    id
                }
            );
        }
        return id;
    }
}

export const CreateSimpleEntryDataFactory = FactoryAbstraction.createImplementation({
    implementation: CreateSimpleEntryDataFactoryImpl,
    dependencies: [EntryDataProcessor, IdentityContext, TenantContext]
});
