import { CmsEntryOpenSearchFieldIndexRegistry as Abstraction } from "./abstractions/CmsEntryOpenSearchFieldIndexRegistry.js";
import { CmsEntryOpenSearchFieldIndex } from "./abstractions/CmsEntryOpenSearchFieldIndex.js";

class CmsEntryOpenSearchFieldIndexRegistryImpl implements Abstraction.Interface {
    public constructor(private readonly fields: CmsEntryOpenSearchFieldIndex.Interface[]) {}

    public get(fieldType: string): CmsEntryOpenSearchFieldIndex.Interface | undefined {
        return this.fields.find(field => field.fieldType === fieldType);
    }

    public getAll(): CmsEntryOpenSearchFieldIndex.Interface[] {
        return this.fields;
    }
}

export const CmsEntryOpenSearchFieldIndexRegistry = Abstraction.createImplementation({
    implementation: CmsEntryOpenSearchFieldIndexRegistryImpl,
    dependencies: [[CmsEntryOpenSearchFieldIndex, { multiple: true }]]
});
