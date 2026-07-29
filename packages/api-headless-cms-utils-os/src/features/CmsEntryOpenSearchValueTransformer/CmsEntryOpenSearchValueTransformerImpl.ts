import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import { CmsEntryOpenSearchValueTransformer as CmsEntryOpenSearchValueTransformerAbstraction } from "./abstractions.js";

class CmsEntryOpenSearchValueTransformerImpl
    implements CmsEntryOpenSearchValueTransformerAbstraction.Interface
{
    public constructor(
        private readonly valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface
    ) {}

    public transform(params: CmsEntryOpenSearchValueTransformerAbstraction.Params): any {
        const { field, value } = params;
        const search = this.valueSearchRegistry.get(field.type);
        if (!search) {
            return value;
        }
        return search.transform({ field, value });
    }
}

export const CmsEntryOpenSearchValueTransformer =
    CmsEntryOpenSearchValueTransformerAbstraction.createImplementation({
        implementation: CmsEntryOpenSearchValueTransformerImpl,
        dependencies: [CmsEntryOpenSearchValueSearchRegistry]
    });
