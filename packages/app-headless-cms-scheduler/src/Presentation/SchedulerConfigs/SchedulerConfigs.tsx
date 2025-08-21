import React from "react";
import { SchedulerListConfig } from "~/Presentation/configs";
import {
    CellActions,
    CellScheduledBy,
    CellScheduledOn,
    CellTitle,
    CellType,
    CellRevision
} from "~/Presentation/components/Cells";
import { CancelItemAction } from "~/Presentation/components/Actions";

const { Browser } = SchedulerListConfig;

export const SchedulerConfigs = () => {
    return (
        <>
            <SchedulerListConfig>
                <Browser.Table.Column
                    name={"title"}
                    header={"Title"}
                    cell={<CellTitle />}
                    sortable={true}
                    hideable={false}
                    size={200}
                />
                <Browser.Table.Column
                    name={"revision"}
                    header={"Revision"}
                    cell={<CellRevision />}
                    hideable={false}
                />
                <Browser.Table.Column
                    name={"scheduledBy"}
                    header={"Author"}
                    cell={<CellScheduledBy />}
                    hideable={false}
                />
                <Browser.Table.Column
                    name={"type"}
                    header={"Action Type"}
                    cell={<CellType />}
                    hideable={false}
                />
                <Browser.Table.Column
                    name={"scheduledOn"}
                    header={"Action Time"}
                    cell={<CellScheduledOn />}
                    sortable={true}
                    hideable={false}
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
                <Browser.Table.Sorting name={"scheduledOn"} field={"scheduledOn"} order={"desc"} />
                <Browser.EntryAction name={"cancel"} element={<CancelItemAction />} />
            </SchedulerListConfig>
        </>
    );
};
