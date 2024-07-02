import React from "react";

import { TrashBinListConfig } from "~/Presentation/configs";
import { BulkActionsDeleteItems, BulkActionsRestoreItems } from "../components/BulkActions";
import {
    CellActions,
    CellCreatedBy,
    CellDeletedBy,
    CellDeletedOn,
    CellTitle
} from "~/Presentation/components/Cells";
import { DeleteItemAction, RestoreItemAction } from "~/Presentation/components/Actions";

const { Browser } = TrashBinListConfig;

export const TrashBinConfigs = () => {
    return (
        <>
            <TrashBinListConfig>
                <Browser.Table.Column
                    name={"name"}
                    header={"Name"}
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
                <Browser.Table.Sorting name={"deletedOn"} field={"deletedOn"} order={"desc"} />
                <Browser.BulkAction name={"restore"} element={<BulkActionsRestoreItems />} />
                <Browser.BulkAction name={"delete"} element={<BulkActionsDeleteItems />} />
                <Browser.EntryAction name={"restore"} element={<RestoreItemAction />} />
                <Browser.EntryAction name={"delete"} element={<DeleteItemAction />} />
            </TrashBinListConfig>
        </>
    );
};
