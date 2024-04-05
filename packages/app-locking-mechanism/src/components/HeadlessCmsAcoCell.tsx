import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { ReactComponent as LockedIcon } from "./assets/lock.svg";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useLockingMechanism } from "~/hooks";
import { UseContentEntriesListHookDecorator } from "./decorators/UseContentEntriesListHookDecorator";
import { ILockingMechanismRecord, IPossiblyLockingMechanismRecord } from "~/types";

const { Browser } = ContentEntryListConfig;

const CellLocked = () => {
    const { isRecordLocked } = useLockingMechanism();

    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    if (isFolderRow(row)) {
        return null;
    } else if (!isRecordLocked(row)) {
        return null;
    }
    // const cell = row as ILockingMechanismRecord;
    return (
        <Tooltip placement={"top"} content={"This entry is currently locked by another user."}>
            <LockedIcon />
        </Tooltip>
    );
};

export const HeadlessCmsAcoCell = () => {
    return (
        <ContentEntryListConfig>
            <UseContentEntriesListHookDecorator />
            <Browser.Table.Column
                before={"name"}
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
