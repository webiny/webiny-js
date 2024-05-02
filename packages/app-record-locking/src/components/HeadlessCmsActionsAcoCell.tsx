import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { ReactComponent as LockedIcon } from "./assets/lock.svg";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useRecordLocking } from "~/hooks";
import { UseContentEntriesListHookDecorator } from "./decorators/UseContentEntriesListHookDecorator";
import { CellActions } from "@webiny/app-headless-cms/admin/components/ContentEntries/Table/Cells";
import styled from "@emotion/styled";
import { UseSaveAndPublishHookDecorator } from "~/components/decorators/UseSaveAndPublishHookDecorator";
import { UseSaveHookDecorator } from "~/components/decorators/UseSaveHookDecorator";

const CenterAlignment = styled("div")({
    display: "block",
    margin: "0 auto",
    width: "28px"
});

const RecordLockingCellActions = CellActions.createDecorator(Original => {
    return function RecordLockingCellActions(props) {
        const { getLockRecordEntry, isRecordLocked } = useRecordLocking();

        const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
        const { row } = useTableRow();

        if (isFolderRow(row)) {
            return <Original {...props} />;
        }

        const entry = getLockRecordEntry(row.id);

        if (!isRecordLocked(entry) || !entry?.$locked) {
            return <Original {...props} />;
        }
        return (
            <CenterAlignment>
                <Tooltip
                    placement={"left"}
                    content={`This entry is currently locked by ${entry.$locked.lockedBy.displayName}.`}
                >
                    <LockedIcon />
                </Tooltip>
            </CenterAlignment>
        );
    };
});

export const HeadlessCmsActionsAcoCell = () => {
    return (
        <ContentEntryListConfig>
            <UseContentEntriesListHookDecorator />
            <UseSaveAndPublishHookDecorator />
            <UseSaveHookDecorator />
            <RecordLockingCellActions />
        </ContentEntryListConfig>
    );
};
