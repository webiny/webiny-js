import { CmsEntryOpenSearchFieldIndexRegistry as Abstraction } from "./abstractions/CmsEntryOpenSearchFieldIndexRegistry.js";
import { CmsEntryOpenSearchFieldIndex } from "./abstractions/CmsEntryOpenSearchFieldIndex.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";
import { FIELD_INDEXING_DEFAULT } from "./constants.js";

class CmsEntryOpenSearchFieldIndexRegistryImpl implements Abstraction.Interface {
    public constructor(private readonly fieldIndexing: CmsEntryOpenSearchFieldIndex.Interface[]) {}

    public get(type: string): CmsEntryOpenSearchFieldIndex.Interface | undefined {
        const fieldType = getBaseFieldType({
            type
        });
        return this.fieldIndexing.find(field => field.fieldType === fieldType);
    }

    public getDefault(): CmsEntryOpenSearchFieldIndex.Interface {
        const fieldIndex = this.fieldIndexing.find(
            field => field.fieldType === FIELD_INDEXING_DEFAULT
        );
        if (fieldIndex) {
            return fieldIndex;
        }
        /**
         * This should never happen, as the default field index plugin exists in our code. This can fail during testing.
         */
        throw new Error(
            `Missing default field index plugin. Please make sure to register a plugin with "${FIELD_INDEXING_DEFAULT}" field type.`
        );
    }

    public getAll(): CmsEntryOpenSearchFieldIndex.Interface[] {
        return this.fieldIndexing;
    }
}

export const CmsEntryOpenSearchFieldIndexRegistry = Abstraction.createImplementation({
    implementation: CmsEntryOpenSearchFieldIndexRegistryImpl,
    dependencies: [[CmsEntryOpenSearchFieldIndex, { multiple: true }]]
});
