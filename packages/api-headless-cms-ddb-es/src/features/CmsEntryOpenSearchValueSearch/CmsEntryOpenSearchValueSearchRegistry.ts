import { CmsEntryOpenSearchValueSearchRegistry as Abstraction } from "./abstractions/CmsEntryOpenSearchValueSearchRegistry.js";
import { CmsEntryOpenSearchValueSearch } from "./abstractions/CmsEntryOpenSearchValueSearch.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

class CmsEntryOpenSearchValueSearchRegistryImpl implements Abstraction.Interface {
    public constructor(private readonly searches: CmsEntryOpenSearchValueSearch.Interface[]) {}

    public get(type: string): Abstraction.SearchValue | undefined {
        const fieldType = getBaseFieldType({ type });
        return this.searches.find(s => {
            return s.fieldType === type;
        });
    }

    public getAll(): Abstraction.SearchValue[] {
        return this.searches;
    }
}

export const CmsEntryOpenSearchValueSearchRegistry = Abstraction.createImplementation({
    implementation: CmsEntryOpenSearchValueSearchRegistryImpl,
    dependencies: [[CmsEntryOpenSearchValueSearch, { multiple: true }]]
});
