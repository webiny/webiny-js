import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import { CmsEntryOpenSearchFieldPathFactory as CmsEntryOpenSearchFieldPathFactoryAbstraction } from "./abstractions.js";

class CmsEntryOpenSearchFieldPathFactoryImpl
    implements CmsEntryOpenSearchFieldPathFactoryAbstraction.Interface
{
    public constructor(
        private readonly valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface
    ) {}

    public create(
        params: CmsEntryOpenSearchFieldPathFactoryAbstraction.Params
    ): CmsEntryOpenSearchFieldPathFactoryAbstraction.Result {
        const { field, key, value, keyword, originalValue } = params;
        const search = this.valueSearchRegistry.get(field.type);

        let fieldPath: string | null = null;
        if (search) {
            fieldPath = search.createPath({ field: field.field, value, key, originalValue });
        }
        if (!fieldPath) {
            fieldPath = field.field.storageId;
            if (field.path) {
                fieldPath = typeof field.path === "function" ? field.path(value) : field.path;
            }
        }

        const result: string[] = field.parents.map(p => p.storageId).concat([fieldPath]);

        return {
            basePath: result.join("."),
            path: result.concat(keyword ? ["keyword"] : []).join(".")
        };
    }
}

export const CmsEntryOpenSearchFieldPathFactory =
    CmsEntryOpenSearchFieldPathFactoryAbstraction.createImplementation({
        implementation: CmsEntryOpenSearchFieldPathFactoryImpl,
        dependencies: [CmsEntryOpenSearchValueSearchRegistry]
    });
