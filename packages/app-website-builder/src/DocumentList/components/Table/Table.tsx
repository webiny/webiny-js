import React from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import type { DocumentDto } from "~/DocumentList/presenters/index.js";
import { useDocumentList } from "~/DocumentList/useDocumentList.js";
import { useSortPages } from "~/features/pages/index.js";

export const Table = () => {
    const { vm } = useDocumentList();
    const { sortPages } = useSortPages();

    return (
        <AcoTable<DocumentDto>
            data={vm.data}
            loading={vm.isLoading}
            sorting={vm.sorting}
            onSortingChange={sort => sortPages(sort)}
            onSelectRow={documents => console.log(documents)}
            selected={[]}
            nameColumnId={"name"}
            namespace={"wb-document"}
        />
    );
};
