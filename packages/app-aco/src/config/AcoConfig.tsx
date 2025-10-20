import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { AdvancedSearchConfig } from "./advanced-search/index.js";
import { AdvancedSearch } from "./advanced-search/index.js";
import type { RecordConfig } from "./record/index.js";
import { Record } from "./record/index.js";
import type { FolderConfig } from "./folder/index.js";
import { Folder } from "./folder/index.js";
import type { TableConfig } from "~/config/table/index.js";
import { Table } from "~/config/table/index.js";

export type { FieldRendererConfig as AdvancedSearchFieldRendererConfig } from "./advanced-search/FieldRenderer.js";
export type { ActionConfig as RecordActionConfig } from "./record/Action.js";
export type { ActionConfig as FolderActionConfig } from "./folder/Action.js";
export type { ColumnConfig as TableColumnConfig } from "./table/Column.js";
export type { SortingConfig as TableSortingConfig } from "./table/Sorting.js";

const base = createConfigurableComponent<AcoConfig>("AcoConfig");

export const AcoConfig = Object.assign(base.Config, { AdvancedSearch, Folder, Record, Table });
export const AcoWithConfig = base.WithConfig;

interface AcoConfig {
    advancedSearch: AdvancedSearchConfig;
    record: RecordConfig;
    folder: FolderConfig;
    table: TableConfig;
}

export function useAcoConfig() {
    const config = base.useConfig();

    const advancedSearch = config.advancedSearch || {};
    const folder = config.folder || {};
    const record = config.record || {};
    const table = config.table || {};

    return useMemo(
        () => ({
            advancedSearch: {
                ...advancedSearch,
                fieldRenderers: [...(advancedSearch.fieldRenderers || [])]
            },
            folder: {
                ...folder,
                actions: [...(folder.actions || [])],
                dropConfirmation: folder.dropConfirmation || false
            },
            record: {
                ...record,
                actions: [...(record.actions || [])]
            },
            table: {
                ...table,
                columns: [...(table.columns || [])],
                sorting: [...(table.sorting || [])]
            }
        }),
        [config]
    );
}
