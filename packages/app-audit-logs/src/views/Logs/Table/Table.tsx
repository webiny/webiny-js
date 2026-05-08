import React, { forwardRef, useMemo } from "react";
import { addMinutes, format } from "date-fns";

import { ReactComponent as PreviewIcon } from "@webiny/icons/info.svg";
import type {
    DataTableColumns,
    DataTableSorting,
    OnDataTableSortingChange
} from "@webiny/admin-ui";
import { DataTable, IconButton, Tooltip } from "@webiny/admin-ui";

import { Text } from "~/components/Text.js";
import {
    ActionWrapper,
    appColumn,
    previewColumn,
    TextGray,
    TimezoneText,
    wideColumn
} from "./styled.js";
import type { ActionType, IAuditLog } from "~/types.js";

interface ActionProps {
    label: string;
    value: ActionType;
}

export const Action = ({ label, value }: ActionProps) => {
    return (
        <ActionWrapper value={value}>
            <Text use={"subtitle1"}>{label}</Text>
        </ActionWrapper>
    );
};

export interface TableProps {
    records: IAuditLog[];
    loading?: boolean;
    handleRecordSelect: (auditLog: IAuditLog) => void;
    sorting: DataTableSorting;
    onSortingChange: OnDataTableSortingChange;
    hasAccessToUsers: boolean;
}

export interface EntryWithPreview extends IAuditLog {
    /**
     * We need the preview property because data table is expecting it in columns.
     */
    preview?: string;
}

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const { records, loading, handleRecordSelect, sorting, onSortingChange, hasAccessToUsers } =
        props;

    const columns: DataTableColumns<EntryWithPreview> = {
        createdOn: {
            header: "Timestamp",
            cell: (row: EntryWithPreview) => {
                const date = new Date(row.createdOn);

                return (
                    <Tooltip
                        side="right"
                        content={`UTC: ${format(
                            addMinutes(date, date.getTimezoneOffset()),
                            "yyyy-MM-dd HH:mm:ss"
                        )}`}
                        trigger={
                            <>
                                <Text use={"subtitle1"}>{format(date, "yyyy-MM-dd HH:mm:ss")}</Text>
                                <TimezoneText use={"body2"}>{format(date, "(O)")}</TimezoneText>
                            </>
                        }
                    />
                );
            },
            enableSorting: true
        },
        app: {
            header: "App/Entity",
            cell: (row: EntryWithPreview) => (
                <>
                    <Text use={"subtitle1"}>{row.app}</Text>
                    {row.entity && (
                        <TextGray use={"body2"}>{` [Entity: ${row.entity.label}]`}</TextGray>
                    )}
                    <br />
                    <TextGray use={"body2"}>{`ID: `}</TextGray>
                    {row.entity.link ? (
                        <a href={row.entity.link} target={"blank"}>
                            <Text use={"body2"}>{row.entityId}</Text>
                        </a>
                    ) : (
                        <Text use={"body2"}>{row.entityId}</Text>
                    )}
                </>
            ),
            className: appColumn
        },
        action: {
            header: "Action",
            cell: (row: EntryWithPreview) => (
                <Action label={row.action.label} value={row.action.value} />
            )
        },
        message: {
            header: "Message",
            cell: (row: EntryWithPreview) => <Text use={"subtitle1"}>{row.message}</Text>,
            className: wideColumn
        },
        ...(hasAccessToUsers && {
            createdBy: {
                header: "Initiator",
                cell: (row: EntryWithPreview) => (
                    <a href={`/admin-users?id=${row.createdBy.id}`} target={"blank"}>
                        <Text use={"subtitle1"}>{row.createdBy.displayName || "-"}</Text>
                    </a>
                )
            }
        }),
        preview: {
            header: "",
            cell: (auditLog: EntryWithPreview) => (
                <IconButton onClick={() => handleRecordSelect(auditLog)} icon={<PreviewIcon />} />
            ),
            className: previewColumn
        }
    };

    const tableSorting = useMemo(() => {
        if (!Array.isArray(sorting) || sorting.length === 0) {
            return [
                {
                    id: "savedOn",
                    desc: true
                }
            ];
        }

        return sorting;
    }, [sorting]);

    return (
        <div ref={ref}>
            <DataTable
                columns={columns}
                data={records}
                loading={loading}
                stickyHeader={true}
                sorting={tableSorting}
                onSortingChange={onSortingChange}
            />
        </div>
    );
});

Table.displayName = "Table";
