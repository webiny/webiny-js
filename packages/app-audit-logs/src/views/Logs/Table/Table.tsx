import React, { forwardRef, useMemo } from "react";
import { format, addMinutes } from "date-fns";

import { ReactComponent as PreviewIcon } from "@material-design-icons/svg/outlined/visibility.svg";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

import { Entry } from "~/utils/transformCmsContentEntriesToRecordEntries";
import { Text } from "~/components/Text";
import {
    ActionWrapper,
    TextGray,
    TimezoneText,
    wideColumn,
    appColumn,
    previewColumn
} from "./styled";

type ActionProps = {
    label: string;
    value: string;
};

export const Action = ({ label, value }: ActionProps) => {
    return (
        <ActionWrapper value={value}>
            <Text use={"subtitle1"}>{label}</Text>
        </ActionWrapper>
    );
};

export interface TableProps {
    records: Entry[];
    loading?: boolean;
    handleRecordSelect: (auditLog: Entry) => void;
    sorting: Sorting;
    onSortingChange: OnSortingChange;
    hasAccessToUsers: boolean;
}

export interface EntryWithPreview extends Entry {
    /**
     * We need the preview property because data table is expecting it in columns.
     */
    preview?: string;
}

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const { records, loading, handleRecordSelect, sorting, onSortingChange, hasAccessToUsers } =
        props;

    const columns: Columns<EntryWithPreview> = {
        savedOn: {
            header: "Timestamp",
            cell: ({ savedOn }) => {
                const date = new Date(savedOn);

                return (
                    <Tooltip
                        placement="right"
                        content={`UTC: ${format(
                            addMinutes(date, date.getTimezoneOffset()),
                            "yyyy-MM-dd HH:mm:ss"
                        )}`}
                    >
                        <Text use={"subtitle1"}>{format(date, "yyyy-MM-dd HH:mm:ss")}</Text>
                        <TimezoneText use={"body2"}>{format(date, "(O)")}</TimezoneText>
                    </Tooltip>
                );
            },
            enableSorting: true
        },
        app: {
            header: "App/Entity",
            cell: ({ app, entity, entityId }) => (
                <>
                    <Text use={"subtitle1"}>{app}</Text>
                    {entity && <TextGray use={"body2"}>{` [Entity: ${entity.label}]`}</TextGray>}
                    <br />
                    <TextGray use={"body2"}>{`ID: `}</TextGray>
                    {entity.link ? (
                        <a href={entity.link} target={"blank"}>
                            <Text use={"body2"}>{entityId}</Text>
                        </a>
                    ) : (
                        <Text use={"body2"}>{entityId}</Text>
                    )}
                </>
            ),
            className: appColumn
        },
        action: {
            header: "Action",
            cell: ({ action }) => <Action label={action.label} value={action.value} />
        },
        message: {
            header: "Message",
            cell: ({ message }) => <Text use={"subtitle1"}>{message}</Text>,
            className: wideColumn
        },
        ...(hasAccessToUsers && {
            initiator: {
                header: "Initiator",
                cell: ({ initiator }) => (
                    <a href={`/admin-users?id=${initiator.id}`} target={"blank"}>
                        <Text use={"subtitle1"}>{initiator.name}</Text>
                    </a>
                )
            }
        }),
        preview: {
            header: "",
            cell: auditLog => (
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
                loadingInitial={loading}
                stickyRows={1}
                sorting={tableSorting}
                onSortingChange={onSortingChange}
            />
        </div>
    );
});

Table.displayName = "Table";
