import { CmsContext } from "~/features/shared/abstractions.js";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import type { CmsEntryValues } from "~/types/index.js";
import { EntryDataProcessor as ProcessorAbstraction } from "./abstractions/index.js";

class EntryDataProcessorImpl implements ProcessorAbstraction.Interface {
    public constructor(private readonly cmsContext: CmsContext.Interface) {}

    public async validateOrThrow<TValues extends CmsEntryValues = CmsEntryValues>(
        params: ProcessorAbstraction.ValidateParams<TValues>
    ): Promise<void> {
        await validateModelEntryDataOrThrow<TValues>({
            context: this.cmsContext,
            model: params.model,
            values: params.values,
            entry: params.entry,
            skipValidation: params.skipValidation
        });
    }

    public async mapReferenceFields<TValues extends CmsEntryValues = CmsEntryValues>(
        params: ProcessorAbstraction.MapReferenceFieldsParams<TValues>
    ): Promise<TValues> {
        return referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model: params.model,
            values: params.values,
            validateEntries: params.validateEntries
        });
    }
}

export const EntryDataProcessor = ProcessorAbstraction.createImplementation({
    implementation: EntryDataProcessorImpl,
    dependencies: [CmsContext]
});
