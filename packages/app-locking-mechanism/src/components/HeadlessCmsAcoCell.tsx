import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { ReactComponent as LockedIcon } from "./assets/lock.svg";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useLockingMechanism } from "~/hooks";
import { UseContentEntriesListHookDecorator } from "./decorators/UseContentEntriesListHookDecorator";

const { Browser } = ContentEntryListConfig;

const CellLocked = () => {
    const { getLockRecordEntry } = useLockingMechanism();

    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return null;
    }

    const entry = getLockRecordEntry(row.id);

    if (!entry?.$locked) {
        return null;
    }

    return (
        <Tooltip
            placement={"top"}
            content={`This entry is currently locked by ${entry.$locked.lockedBy.displayName}.`}
        >
            <LockedIcon />
        </Tooltip>
    );
};

export const HeadlessCmsAcoCell = () => {
    return (
        <ContentEntryListConfig>
            <UseContentEntriesListHookDecorator />
            <Browser.Table.Column
                name={"locked"}
                header={<LockedIcon />}
                cell={<CellLocked />}
                visible={true}
                sortable={false}
                hideable={false}
                resizable={false}
                size={54}
            />
        </ContentEntryListConfig>
    );
};
