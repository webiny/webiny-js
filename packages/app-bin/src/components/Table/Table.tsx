import React from "react";
import { Column, DataTable } from "@webiny/ui/DataTable";
import { BinPresenterViewModel } from "~/abstractions";
import { BinEntryDTO } from "~/domain";
import { ButtonDefault } from "@webiny/ui/Button";

export interface TableProps {
    vm: BinPresenterViewModel;
    onEntryDelete: (id: string) => Promise<void>;
}

export const Table = (props: TableProps) => {
    const columns: Column<BinEntryDTO> = [
        {
            id: "title",
            header: "Title"
        },
        {
            id: "id",
            header: "id"
        },
        {
            id: "delete",
            header: " ",
            cell: (row: BinEntryDTO) => (
                <ButtonDefault onClick={() => props.onEntryDelete(row.id)}>
                    {"Delete"}
                </ButtonDefault>
            )
        }
    ];

    return (
        <DataTable data={props.vm.entries} columns={columns} loadingInitial={props.vm.loading} />
    );
};
