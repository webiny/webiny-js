import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { Company } from "../types";

const { Browser } = ContentEntryListConfig;
const { useTableRow, isFolderRow } = Browser.Table.Column;

export const EmployeeNameCell = () => {
    // useTableRow() allows you to access the entire data of the current row.
    const { row } = useTableRow<Company>();

    // isFolderRow() allows for custom rendering when the current row is a folder.
    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    return (
        <span>
            {row.firstName} {row.lastName}
        </span>
    );
};
