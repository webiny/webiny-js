import React, { useMemo } from "react";
import { createFoldersData, createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import { useDocumentList } from "~/modules/pages/PagesList/useDocumentList.js";
import { useSortPages } from "~/features/pages/index.js";
import { useSelectPages } from "~/features/pages/selectPages/useSelectPages.js";
import type { TableRow } from "~/modules/pages/types.js";
import { usePageListConfig } from "~/modules/pages/configs/index.js";

export const Table = () => {
    const { vm } = useDocumentList();
    const { sortPages } = useSortPages();
    const { selectPages } = useSelectPages();
    const { browser } = usePageListConfig();

    const data = useMemo<TableRow[]>(() => {
        return [...createFoldersData(vm.folders), ...createRecordsData(vm.data)];
    }, [vm.folders, vm.data]);

    const selected = useMemo<TableRow[]>(() => {
        return createRecordsData(vm.selected);
    }, [vm.selected]);

    return (
        <AcoTable<TableRow>
            columns={browser.table.columns}
            data={data}
            loading={vm.isLoading}
            sorting={vm.sorting}
            onSortingChange={sort => sortPages(sort)}
            onSelectRow={documents => selectPages(documents)}
            selected={selected}
            nameColumnId={"name"}
            namespace={"wbPage"}
        />
    );
};
