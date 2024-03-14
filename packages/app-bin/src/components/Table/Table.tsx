import React from "react";
import { Columns, DataTable } from "@webiny/ui/DataTable";
import { BinPresenterViewModel } from "~/abstractions";
import { BinEntryDTO } from "~/domain";
import { ButtonDefault } from "@webiny/ui/Button";

export interface TableProps {
    vm: BinPresenterViewModel;
    onEntryDelete: (id: string) => Promise<void>;
}

export const Table = (props: TableProps) => {
    const columns: Columns<BinEntryDTO> = {
        title: {
            header: "Title"
        },
        id: {
            header: "ID"
        },
        delete: {
            header: " ",
            cell: (row: BinEntryDTO) => (
                <ButtonDefault onClick={() => props.onEntryDelete(row.id)}>
                    {"Delete"}
                </ButtonDefault>
            )
        }
    };

    return (
        <DataTable data={props.vm.entries} columns={columns} loadingInitial={props.vm.loading} />
    );
};
