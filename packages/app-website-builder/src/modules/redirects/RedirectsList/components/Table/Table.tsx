import React, { useMemo } from "react";
import { Table as AcoTable, createRecordsData } from "@webiny/app-aco";
import type { TableRow } from "~/modules/redirects/RedirectsList/presenters/index.js";
import { useDocumentList } from "~/modules/redirects/RedirectsList/useDocumentList.js";
import { useSortRedirects } from "~/features/redirects/index.js";
import { useSelectRedirects } from "~/features/redirects/selectRedirects/useSelectRedirects.js";
import { useRedirectListConfig } from "~/modules/redirects/configs/index.js";

export const Table = () => {
    const { vm } = useDocumentList();
    const { sortRedirects } = useSortRedirects();
    const { selectRedirects } = useSelectRedirects();
    const { browser } = useRedirectListConfig();

    const selected = useMemo<TableRow[]>(() => {
        return createRecordsData(vm.selected);
    }, [vm.selected]);

    return (
        <AcoTable<TableRow>
            columns={browser.table.columns}
            data={vm.data}
            loading={vm.isLoading}
            sorting={vm.sorting}
            onSortingChange={sort => sortRedirects(sort)}
            onSelectRow={documents => {
                selectRedirects(documents);
            }}
            selected={selected}
            nameColumnId={"redirectFrom"}
            namespace={"wbRedirect"}
        />
    );
};
