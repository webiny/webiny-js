import React from "react";
import { observer } from "mobx-react-lite";
import { useContainer } from "@webiny/app";
import { ReactComponent as LockedIcon } from "@webiny/icons/lock.svg";
import { Icon, Tooltip } from "@webiny/admin-ui";
import { useModel, ContentEntryListConfig } from "@webiny/app-headless-cms";
import { ListLockRecordsPresenter } from "../abstractions.js";

const { Browser } = ContentEntryListConfig;

const ActionsCell = observer(({ children }: { children: React.ReactNode }) => {
    const { model } = useModel();
    const container = useContainer();
    const presenter = React.useMemo(
        () => container.resolve(ListLockRecordsPresenter),
        [container]
    );
    const { useTableRow, isFolderRow } = Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{children}</>;
    }

    const lockRecord = presenter.getLockRecord(row.id);

    if (!lockRecord) {
        return <>{children}</>;
    }

    return (
        <Tooltip
            side={"left"}
            content={`This ${model.name} is currently locked by ${lockRecord.lockedBy.displayName}.`}
            trigger={<Icon icon={<LockedIcon />} label={"Locked entry"} color={"neutral-light"} />}
        />
    );
});

export const RecordLockingCellActionsDecorator = Browser.Table.Column.createDecorator(Original => {
    return function RecordLockingCellActions(props) {
        if (props.name === "actions" && props.cell) {
            return <Original {...props} cell={<ActionsCell>{props.cell}</ActionsCell>} />;
        }

        return <Original {...props} />;
    };
});
