import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as LockedIcon } from "@webiny/icons/lock.svg";
import { Icon, Tooltip } from "@webiny/admin-ui";
import { useModel } from "@webiny/app-headless-cms";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import type { IListLockRecordsPresenter } from "../abstractions.js";

const { Browser } = ContentEntryListConfig;

interface ActionsCellProps {
    children: React.ReactNode;
    presenter: IListLockRecordsPresenter;
}

const ActionsCell = observer(({ children, presenter }: ActionsCellProps) => {
    const { model } = useModel();
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

export function createLockIndicatorDecorator(presenter: IListLockRecordsPresenter) {
    return Browser.Table.Column.createDecorator(Original => {
        return function RecordLockingCellActions(props) {
            if (props.name === "actions" && props.cell) {
                return (
                    <Original
                        {...props}
                        cell={<ActionsCell presenter={presenter}>{props.cell}</ActionsCell>}
                    />
                );
            }

            return <Original {...props} />;
        };
    });
}
