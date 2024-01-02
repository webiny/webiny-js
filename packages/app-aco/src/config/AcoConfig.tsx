import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Folder, FolderConfig } from "./folder";
import { Table, TableConfig } from "~/config/table";

export { ActionConfig as FolderActionConfig } from "./folder/Action";
export { ColumnConfig as TableColumnConfig } from "./table/Column";

const base = createConfigurableComponent<AcoConfig>("AcoConfig");

export const AcoConfig = Object.assign(base.Config, { Folder, Table });
export const AcoWithConfig = base.WithConfig;

interface AcoConfig {
    folder: FolderConfig;
    table: TableConfig;
}

export function useAcoConfig() {
    const config = base.useConfig();

    const folder = config.folder || {};
    const table = config.table || {};

    return useMemo(
        () => ({
            folder: {
                ...folder,
                actions: [...(folder.actions || [])]
            },
            table: {
                ...table,
                columns: [...(table.columns || [])]
            }
        }),
        [config]
    );
}
