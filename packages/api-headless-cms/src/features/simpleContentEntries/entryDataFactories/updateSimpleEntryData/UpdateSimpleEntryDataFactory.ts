import { cleanInputValues } from "~/features/contentEntry/entryDataFactories/cleanInputValues.js";
import { EntryDataProcessor } from "~/features/contentEntry/entryDataProcessor/index.js";
import {
    SIMPLE_ENTRY_EXPIRES_AT,
    SIMPLE_ENTRY_LOCKED,
    SIMPLE_ENTRY_STATUS,
    SIMPLE_ENTRY_VERSION
} from "~/features/simpleContentEntries/constants.js";
import type {
    ISimpleCmsEntry,
    IUpdateSimpleEntryInput
} from "~/features/simpleContentEntries/types.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { UpdateSimpleEntryDataFactory as FactoryAbstraction } from "./abstractions/index.js";

class UpdateSimpleEntryDataFactoryImpl implements FactoryAbstraction.Interface {
    public constructor(private readonly entryDataProcessor: EntryDataProcessor.Interface) {}

    public async update<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        original: ISimpleCmsEntry<TValues>,
        rawInput: IUpdateSimpleEntryInput<TValues>
    ): Promise<FactoryAbstraction.Response<TValues>> {
        const initialValues = cleanInputValues<TValues>(model, rawInput.values || ({} as TValues));

        await this.entryDataProcessor.validateOrThrow<TValues>({
            model,
            values: initialValues,
            entry: original as unknown as CmsEntry<TValues>
        });

        const values = await this.entryDataProcessor.mapReferenceFields<TValues>({
            model,
            values: initialValues,
            validateEntries: true
        });

        /*
         * Identity and the creation stamp are carried over; there is no savedOn or modifiedOn to
         * refresh, because a simple entry records only when it was created. The pinned fields are
         * re-applied from the constants rather than spread from the original, so a stored record
         * that somehow broke the invariant cannot propagate it through an update.
         */
        const entry: ISimpleCmsEntry<TValues> = {
            ...original,
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
}

export const UpdateSimpleEntryDataFactory = FactoryAbstraction.createImplementation({
    implementation: UpdateSimpleEntryDataFactoryImpl,
    dependencies: [EntryDataProcessor]
});
