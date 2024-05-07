import React from "react";
import { ContentEntryListConfig, useModel } from "@webiny/app-headless-cms";
import { ReactComponent as LockedIcon } from "@material-design-icons/svg/round/lock.svg";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useRecordLocking } from "~/hooks";
import { UseContentEntriesListHookDecorator } from "./decorators/UseContentEntriesListHookDecorator";
import styled from "@emotion/styled";
import { UseSaveEntryDecorator } from "~/components/decorators/UseSaveEntryDecorator";

const CenterAlignment = styled.div`
    display: block;
    margin: 0 auto;
    width: 28px;
    svg {
        fill: var(--mdc-theme-text-secondary-on-background);
    }
`;

const { Browser } = ContentEntryListConfig;

interface ActionsCellProps {
    children: React.ReactNode;
}

const ActionsCell = ({ children }: ActionsCellProps) => {
    const { model } = useModel();
    const { getLockRecordEntry, isRecordLocked } = useRecordLocking();

    const { useTableRow, isFolderRow } = Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{children}</>;
    }

    const entry = getLockRecordEntry(row.id);

    if (!isRecordLocked(entry) || !entry?.$locked) {
        return <>{children}</>;
    }
    return (
        <CenterAlignment>
            <Tooltip
                placement={"left"}
                content={`This ${model.name} is currently locked by ${entry.$locked.lockedBy.displayName}.`}
            >
                <LockedIcon />
            </Tooltip>
        </CenterAlignment>
    );
};

const RecordLockingCellActions = Browser.Table.Column.createDecorator(Original => {
    return function RecordLockingCellActions(props) {
        if (props.name === "actions" && props.cell) {
            return <Original {...props} cell={<ActionsCell>{props.cell}</ActionsCell>} />;
        }

        return <Original {...props} />;
    };
});

export const HeadlessCmsActionsAcoCell = () => {
    return (
        <>
            <UseContentEntriesListHookDecorator />
            <UseSaveEntryDecorator />
            <RecordLockingCellActions />
        </>
    );
};
