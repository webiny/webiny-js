import { cleanInputValues } from "~/features/contentEntry/entryDataFactories/cleanInputValues.js";
import { EntryDataProcessor } from "~/features/contentEntry/entryDataProcessor/index.js";
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
         * Identity and the pinned fields are carried over untouched. There is no savedOn or
         * modifiedOn to refresh - a simple entry records only when it was created.
         */
        const entry: ISimpleCmsEntry<TValues> = {
            ...original,
            values
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
