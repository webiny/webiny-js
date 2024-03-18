import React from "react";
import { TrashBinRenderer } from "~/components/TrashBinRenderer";
import {
    CellActions,
    CellCreatedBy,
    CellDeletedBy,
    CellDeletedOn,
    CellTitle
} from "~/components/Cells";
import { TrashBinListConfig } from "~/configs";
import { DeleteEntryAction } from "~/components/Actions";
import { BulkActionsDeleteEntries } from "~/components/BulkActions";

const { Browser } = TrashBinListConfig;

export const TrashBin = () => {
    return (
        <>
            <TrashBinRenderer />
            <TrashBinListConfig>
                <Browser.Table.Column
                    name={"title"}
                    header={"Title"}
                    cell={<CellTitle />}
                    sortable={true}
                    hideable={false}
                    size={200}
                />
                <Browser.Table.Column
                    name={"createdBy"}
                    header={"Author"}
                    cell={<CellCreatedBy />}
                />
                <Browser.Table.Column
                    name={"deletedBy"}
                    header={"Deleted by"}
                    cell={<CellDeletedBy />}
                />
                <Browser.Table.Column
                    name={"deletedOn"}
                    header={"Deleted on"}
                    cell={<CellDeletedOn />}
                    sortable={true}
                />
                <Browser.Table.Column
                    name={"actions"}
                    header={" "}
                    cell={<CellActions />}
                    size={80}
                    className={"rmwc-data-table__cell--align-end"}
                    hideable={false}
                    resizable={false}
                />
                <Browser.BulkAction name={"delete"} element={<BulkActionsDeleteEntries />} />
                <Browser.EntryAction name={"delete"} element={<DeleteEntryAction />} />
            </TrashBinListConfig>
        </>
    );
};
