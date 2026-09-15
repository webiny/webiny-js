import React, { forwardRef, useMemo } from "react";
import { addMinutes, format } from "date-fns";
import { ReactComponent as PreviewIcon } from "@webiny/icons/search.svg";
import {
    Button,
    type DataTableColumns,
    type DataTableSorting,
    type OnDataTableSortingChange
} from "@webiny/admin-ui";
import { DataTable, Tooltip } from "@webiny/admin-ui";

import { Text } from "~/components/Text.js";
import { getActionColorClasses } from "./styled.js";
import type { IAuditLog } from "~/types.js";

interface ActionProps {
    label: string;
    value: string;
}

export const Action = ({ label, value }: ActionProps) => {
    return (
        <div
            className={`px-sm w-fit border border-solid rounded-[5px] ${getActionColorClasses(value)}`}
        >
            <Text use={"subtitle1"}>{label}</Text>
        </div>
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
                                <span className={"px-xs text-neutral-dimmed"}>
                                    <Text use={"body2"}>{format(date, "(O)")}</Text>
                                </span>
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
                    <Text use={"subtitle1"} className={"text-neutral-strong"}>
                        {row.app}
                    </Text>
                    {row.entity && (
                        <>
                            &nbsp;/&nbsp;
                            <span className={"text-neutral-strong"}>
                                <Text use={"body2"}>{row.entity.label}</Text>
                            </span>
                        </>
                    )}
                    <br />
                    <span className={"text-neutral-dimmed"}>
                        <Text use={"body2"}>{`ID: `}</Text>
                        {row.entity.link ? (
                            <a href={row.entity.link} target={"blank"}>
                                <Text use={"body2"}>{row.entityId}</Text>
                            </a>
                        ) : (
                            <Text use={"body2"}>{row.entityId}</Text>
                        )}
                    </span>
                </>
            ),
            className: "!w-[280px]"
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
            className: "!w-auto"
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
                <Button
                    variant={"secondary"}
                    onClick={() => handleRecordSelect(auditLog)}
                    icon={<PreviewIcon />}
                    text={"Details"}
                />
            ),
            className: "!w-[100px]"
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
