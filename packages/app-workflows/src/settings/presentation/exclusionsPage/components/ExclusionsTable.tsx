import React from "react";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Table } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import type { ExclusionRowVm } from "../abstractions.js";
import type { ExclusionsPagePresenter } from "../abstractions.js";
import { EXCLUSIONS_COLUMN_REASON } from "../exclusionsCopy.js";
import { EXCLUSIONS_COLUMN_STATUS } from "../exclusionsCopy.js";
import { EXCLUSIONS_COLUMN_UNTIL } from "../exclusionsCopy.js";
import { EXCLUSIONS_COLUMN_USER } from "../exclusionsCopy.js";
import { EXCLUSIONS_EDIT_TITLE } from "../exclusionsCopy.js";
import { EXCLUSIONS_REMOVE_TITLE } from "../exclusionsCopy.js";

export interface ExclusionsTableProps {
    rows: ExclusionRowVm[];
    presenter: ExclusionsPagePresenter.Interface;
}

interface ExclusionRowProps {
    row: ExclusionRowVm;
    presenter: ExclusionsPagePresenter.Interface;
}

interface MutedTextProps {
    muted: boolean;
    text: string;
}

interface ExclusionCellProps {
    row: ExclusionRowVm;
}

// A muted value (a deleted user, a missing reason) is a description; the rest is plain text.
const MutedText = ({ muted, text }: MutedTextProps) => {
    if (muted) {
        return (
            <FormComponentDescription className="mb-0" data-muted="" text={<Text>{text}</Text>} />
        );
    }

    return <Text>{text}</Text>;
};

/*
 * The user cell: a muted row is a deleted user, marked with the person_off icon (QBZ-91; not an
 * avatar, so Q64 keeps it); the sub line is "This user no longer exists". An unresolved user shows
 * the raw id as its label.
 */
const ExclusionUserCell = ({ row }: ExclusionCellProps) => {
    let icon: React.ReactNode = null;
    if (row.muted) {
        icon = (
            <Icon
                icon={<PersonOffIcon />}
                label=""
                size="sm"
                color="neutral-light"
                data-icon="person_off"
            />
        );
    }

    let subLine: React.ReactNode = null;
    if (row.subLine !== null) {
        subLine = <FormComponentNote className="mt-0" text={row.subLine} />;
    }

    return (
        <div className="flex items-center gap-sm">
            {icon}
            <div className="flex flex-col">
                <MutedText muted={row.muted} text={row.label} />
                {subLine}
            </div>
        </div>
    );
};

// Active as a warning tag, Expired as a neutral tag (R323, QBZ-76).
const ExclusionStatusTag = ({ row }: ExclusionCellProps) => {
    if (row.status === "active") {
        return <Tag variant="warning" content={row.statusLabel} data-status="active" />;
    }

    return <Tag variant="neutral-light" content={row.statusLabel} data-status="expired" />;
};

// Edit and Remove, always enabled (Q64); the click stops here so the row does not open Edit too.
const ExclusionRowActions = ({ row, presenter }: ExclusionRowProps) => {
    const onEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        presenter.openEdit(row.userId);
    };

    const onRemove = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        presenter.openRemove(row.userId);
    };

    return (
        <div className="flex items-center justify-end gap-xxs">
            <IconButton
                variant="ghost"
                size="sm"
                icon={<EditIcon />}
                aria-label={row.editLabel}
                title={EXCLUSIONS_EDIT_TITLE}
                onClick={onEdit}
            />
            <IconButton
                variant="ghost"
                size="sm"
                icon={<DeleteIcon />}
                aria-label={row.removeLabel}
                title={EXCLUSIONS_REMOVE_TITLE}
                onClick={onRemove}
            />
        </div>
    );
};

const ExclusionRow = ({ row, presenter }: ExclusionRowProps) => {
    return (
        <Table.Row
            data-user-id={row.userId}
            className="cursor-pointer"
            onClick={() => presenter.openEdit(row.userId)}
        >
            <Table.Cell>
                <ExclusionUserCell row={row} />
            </Table.Cell>
            <Table.Cell>
                <MutedText muted={row.reasonMuted} text={row.reason} />
            </Table.Cell>
            <Table.Cell className="whitespace-nowrap">
                <span title={row.untilTitle}>{row.untilLabel}</span>
            </Table.Cell>
            <Table.Cell>
                <ExclusionStatusTag row={row} />
            </Table.Cell>
            <Table.Cell>
                <ExclusionRowActions row={row} presenter={presenter} />
            </Table.Cell>
        </Table.Row>
    );
};

// Every entry of the current tab and filter, in the presenter's order (R322, R323).
export const ExclusionsTable = ({ rows, presenter }: ExclusionsTableProps) => {
    return (
        <div data-testid="exclusions-table">
            <Table bordered>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>{EXCLUSIONS_COLUMN_USER}</Table.Head>
                        <Table.Head>{EXCLUSIONS_COLUMN_REASON}</Table.Head>
                        <Table.Head>{EXCLUSIONS_COLUMN_UNTIL}</Table.Head>
                        <Table.Head>{EXCLUSIONS_COLUMN_STATUS}</Table.Head>
                        <Table.Head />
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {rows.map(row => (
                        <ExclusionRow key={row.userId} row={row} presenter={presenter} />
                    ))}
                </Table.Body>
            </Table>
        </div>
    );
};
