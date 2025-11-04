import React from "react";
import { Tooltip } from "@webiny/admin-ui";
import { THREAT_SCAN } from "~/modules/Enterprise/constants.js";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";

const { Table } = FileManagerViewConfig.Browser;

interface ThreatScanInProgressTableCellProps {
    children: React.ReactNode;
}

export const ThreatScanInProgressTableCell = ({ children }: ThreatScanInProgressTableCellProps) => {
    const { useTableRow, isFolderRow } = Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{children}</>;
    }

    if (!row.data.tags.length || !row.data.tags.includes(THREAT_SCAN.IN_PROGRESS)) {
        return <>{children}</>;
    }

    return (
        <Tooltip
            content={`This file is currently being scanned for threats.`}
            trigger={
                <div className={"pointer-events-none opacity-50 block truncate"}>{children}</div>
            }
        />
    );
};
