import type { CmsEntryOpenSearchValueSearch } from "~/features/CmsEntryOpenSearchValueSearch/index.js";

export class RefSearch implements CmsEntryOpenSearchValueSearch.Interface {
    public readonly fieldType = "ref";

    public transform(params: CmsEntryOpenSearchValueSearch.Transform): any {
        return params.value;
    }

    public createPath(params: CmsEntryOpenSearchValueSearch.CreatePath): string | null {
        const { field, key } = params;
        if (key && key.match("entryId") === null) {
            return `${field.storageId}.id`;
        }
        return `${field.storageId}.entryId`;
    }
}
