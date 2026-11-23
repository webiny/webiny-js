import React, { useMemo, useState } from "react";
import { Avatar } from "@webiny/admin-ui";
import { DataTable } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { DataTableColumns } from "@webiny/admin-ui";
import type { DataTableColumnVisibility } from "@webiny/admin-ui";
import type { DataTableSorting } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
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
    presenter: ExclusionsPagePresenter.Interface;
}

// A row as `DataTable` takes it: the row view model with the `id` the table keys rows by.
interface ExclusionsTableEntry extends ExclusionRowVm {
    id: string;
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
 * The user's avatar: the initials of a found user; a deleted user is marked with the person_off
 * icon (QBZ-91); a user whose name is not known yet shows the plain person icon.
 */
const ExclusionUserAvatar = ({ row }: ExclusionCellProps) => {
    if (row.muted) {
        return (
            <Avatar
                aria-hidden={true}
                variant="subtle"
                fallback={
                    <Avatar.Fallback>
                        <PersonOffIcon data-icon="person_off" />
                    </Avatar.Fallback>
                }
            />
        );
    }

    if (row.initials === null) {
        return (
            <Avatar
                aria-hidden={true}
                variant="subtle"
                fallback={
                    <Avatar.Fallback>
                        <PersonIcon data-icon="person" />
                    </Avatar.Fallback>
                }
            />
        );
    }

    return (
        <Avatar
            aria-hidden={true}
            variant="subtle"
            fallback={<Avatar.Fallback>{row.initials}</Avatar.Fallback>}
        />
    );
};

/*
 * The user cell: the avatar, then the label and the sub line (the teams, or "This user no longer
 * exists" for a deleted user). An unresolved user shows the raw id as its label. The cell carries
 * the row's user id, which the row click reads.
 */
const ExclusionUserCell = ({ row }: ExclusionCellProps) => {
    let subLine: React.ReactNode = null;
    if (row.subLine !== null) {
        subLine = <FormComponentNote className="mt-0" text={row.subLine} />;
    }

    return (
        <div data-user-id={row.userId} className="flex items-center gap-sm">
            <ExclusionUserAvatar row={row} />
            <div className="flex flex-col min-w-0">
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

/*
 * Every entry of the current tab and filter, in the presenter's order (R322, R323), edge to edge
 * like the Content Reviews list. The list is fully loaded, so the User column sorts on the client
 * through the presenter; the other columns can be hidden from the header's column settings.
 */
export const ExclusionsTable = createReactiveComponent((props: ExclusionsTableProps) => {
    const { presenter } = props;
    const vm = presenter.vm;
    const [columnVisibility, setColumnVisibility] = useState<DataTableColumnVisibility>({});

    const columns = useMemo(() => {
        const result: DataTableColumns<ExclusionsTableEntry> = {
            label: {
                header: EXCLUSIONS_COLUMN_USER,
                cell: row => <ExclusionUserCell row={row} />,
                enableSorting: true,
                enableHiding: false,
                size: 280
            },
            reason: {
                header: EXCLUSIONS_COLUMN_REASON,
                cell: row => <MutedText muted={row.reasonMuted} text={row.reason} />,
                size: 400
            },
            untilLabel: {
                header: EXCLUSIONS_COLUMN_UNTIL,
                cell: row => <span title={row.untilTitle}>{row.untilLabel}</span>,
                size: 240
            },
            status: {
                header: EXCLUSIONS_COLUMN_STATUS,
                cell: row => <ExclusionStatusTag row={row} />,
                size: 160
            },
            userId: {
                header: "",
                cell: row => <ExclusionRowActions row={row} presenter={presenter} />,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false,
                truncate: false,
                size: 96
            }
        };
        return result;
    }, [presenter]);

    const data = useMemo(() => {
        return vm.rows.map(row => ({ ...row, id: row.userId }));
    }, [vm.rows]);

    const sorting = useMemo<DataTableSorting>(() => {
        return [{ id: "label", desc: vm.sortDirection === "desc" }];
    }, [vm.sortDirection]);

    // Only the User column sorts, ascending or descending, never unsorted.
    const onSortingChange = () => {
        presenter.toggleSort();
    };

    /*
     * A click anywhere on a row opens Edit (the row actions stop their own clicks). `DataTable` rows
     * take no click handler, so the click is read here from the user cell of the clicked row; the
     * header row has no user cell.
     */
    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!(event.target instanceof Element)) {
            return;
        }
        const row = event.target.closest("tr");
        const cell = row?.querySelector<HTMLElement>("[data-user-id]");
        const userId = cell?.dataset.userId;
        if (userId) {
            presenter.openEdit(userId);
        }
    };

    return (
        <div data-testid="exclusions-table" onClick={onClick}>
            <DataTable
                columns={columns}
                data={data}
                sorting={sorting}
                onSortingChange={onSortingChange}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
            />
        </div>
    );
});
