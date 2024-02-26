import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Record, RecordConfig } from "./record";
import { Folder, FolderConfig } from "./folder";
import { Table, TableConfig } from "~/config/table";

export { ActionConfig as RecordActionConfig } from "./record/Action";
export { ActionConfig as FolderActionConfig } from "./folder/Action";
export { ColumnConfig as TableColumnConfig } from "./table/Column";

const base = createConfigurableComponent<AcoConfig>("AcoConfig");

export const AcoConfig = Object.assign(base.Config, { Folder, Record, Table });
export const AcoWithConfig = base.WithConfig;

interface AcoConfig {
    record: RecordConfig;
    folder: FolderConfig;
    table: TableConfig;
}

export function useAcoConfig() {
    const config = base.useConfig();

    const folder = config.folder || {};
    const record = config.record || {};
    const table = config.table || {};

    return useMemo(
        () => ({
            folder: {
                ...folder,
                actions: [...(folder.actions || [])]
            },
            record: {
                ...record,
                actions: [...(record.actions || [])]
            },
            table: {
                ...table,
                columns: [...(table.columns || [])]
            }
        }),
        [config]
    );
}
