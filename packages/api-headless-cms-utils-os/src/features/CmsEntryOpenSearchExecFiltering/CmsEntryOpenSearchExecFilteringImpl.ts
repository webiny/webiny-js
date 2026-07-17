import { CmsEntryOpenSearchFilterRegistry } from "~/features/CmsEntryOpenSearchFilter/index.js";
import { CmsEntryOpenSearchOperatorList } from "~/features/CmsEntryOpenSearchOperatorList/index.js";
import { CmsEntryOpenSearchValueTransformer } from "~/features/CmsEntryOpenSearchValueTransformer/index.js";
import { CmsEntryOpenSearchFieldPathFactory } from "~/features/CmsEntryOpenSearchFieldPathFactory/index.js";
import { createExecFiltering } from "~/operations/entry/elasticsearch/filtering/index.js";
import { CmsEntryOpenSearchExecFiltering } from "./abstractions.js";

class CmsEntryOpenSearchExecFilteringClass implements CmsEntryOpenSearchExecFiltering.Interface {
    public constructor(
        private readonly operatorList: CmsEntryOpenSearchOperatorList.Interface,
        private readonly valueTransformer: CmsEntryOpenSearchValueTransformer.Interface,
        private readonly fieldPathFactory: CmsEntryOpenSearchFieldPathFactory.Interface,
        private readonly filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface
    ) {}

    public execute(params: CmsEntryOpenSearchExecFiltering.Params): void {
        const { model, fields, where, query } = params;

        const execFiltering = createExecFiltering({
            model,
            fields,
            operatorList: this.operatorList,
            valueTransformer: this.valueTransformer,
            fieldPathFactory: this.fieldPathFactory,
            filterRegistry: this.filterRegistry
        });

        execFiltering({ where, query });
    }
}

export const CmsEntryOpenSearchExecFilteringImpl =
    CmsEntryOpenSearchExecFiltering.createImplementation({
        implementation: CmsEntryOpenSearchExecFilteringClass,
        dependencies: [
            CmsEntryOpenSearchOperatorList,
            CmsEntryOpenSearchValueTransformer,
            CmsEntryOpenSearchFieldPathFactory,
            CmsEntryOpenSearchFilterRegistry
        ]
    });
