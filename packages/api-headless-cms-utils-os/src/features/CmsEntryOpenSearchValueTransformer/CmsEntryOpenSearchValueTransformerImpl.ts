import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import { CmsEntryOpenSearchValueTransformer } from "./abstractions.js";

class CmsEntryOpenSearchValueTransformerClass
    implements CmsEntryOpenSearchValueTransformer.Interface
{
    public constructor(
        private readonly valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface
    ) {}

    public transform(params: CmsEntryOpenSearchValueTransformer.Params): any {
        const { field, value } = params;
        const search = this.valueSearchRegistry.get(field.type);
        if (!search) {
            return value;
        }
        return search.transform({ field, value });
    }
}

export const CmsEntryOpenSearchValueTransformerImpl =
    CmsEntryOpenSearchValueTransformer.createImplementation({
        implementation: CmsEntryOpenSearchValueTransformerClass,
        dependencies: [CmsEntryOpenSearchValueSearchRegistry]
    });
