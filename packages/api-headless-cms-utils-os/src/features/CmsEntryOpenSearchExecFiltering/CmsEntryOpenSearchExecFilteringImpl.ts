import { OpenSearchQueryBuilderOperatorRegistry } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import { CmsEntryOpenSearchFilterRegistry } from "~/features/CmsEntryOpenSearchFilter/index.js";
import { createExecFiltering } from "~/operations/entry/elasticsearch/filtering/index.js";
import { CmsEntryOpenSearchExecFiltering } from "./abstractions.js";

class CmsEntryOpenSearchExecFilteringClass implements CmsEntryOpenSearchExecFiltering.Interface {
    public constructor(
        private readonly operatorRegistry: OpenSearchQueryBuilderOperatorRegistry.Interface,
        private readonly valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface,
        private readonly filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface
    ) {}

    public execute(params: CmsEntryOpenSearchExecFiltering.Params): void {
        const { model, fields, where, query } = params;

        const execFiltering = createExecFiltering({
            model,
            fields,
            operatorRegistry: this.operatorRegistry,
            valueSearchRegistry: this.valueSearchRegistry,
            filterRegistry: this.filterRegistry
        });

        execFiltering({ where, query });
    }
}

export const CmsEntryOpenSearchExecFilteringImpl =
    CmsEntryOpenSearchExecFiltering.createImplementation({
        implementation: CmsEntryOpenSearchExecFilteringClass,
        dependencies: [
            OpenSearchQueryBuilderOperatorRegistry,
            CmsEntryOpenSearchValueSearchRegistry,
            CmsEntryOpenSearchFilterRegistry
        ]
    });
