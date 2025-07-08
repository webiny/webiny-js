import React from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import type { DocumentDto } from "~/DocumentList/presenters/index.js";
import { useDocumentList } from "~/DocumentList/useDocumentList.js";

export const Table = () => {
    const { vm } = useDocumentList();

    return (
        <AcoTable<DocumentDto>
            data={vm.data}
            loading={vm.isLoading}
            onSelectRow={documents => console.log(documents)}
            onSortingChange={sort => console.log(sort)}
            selected={[]}
            nameColumnId={"name"}
            sorting={[]}
            namespace={"wb-document"}
        />
    );
};
