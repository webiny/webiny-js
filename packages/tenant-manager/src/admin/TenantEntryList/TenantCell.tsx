import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { TenantEntry } from "../types.js";
import { InstallTenant } from "./InstallTenantButton/InstallTenant.js";
import { ManageTenant } from "./ManageTenant.js";

const { Browser } = ContentEntryListConfig;
const { useTableRow, isFolderRow } = Browser.Table.Column;

export const TenantCell = () => {
    // useTableRow() allows you to access the entire data of the current row.
    const { row } = useTableRow<TenantEntry>();

    // isFolderRow() allows for custom rendering when the current row is a folder.
    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    if (!row.data.values.isInstalled) {
        return <InstallTenant tenant={row.data} />;
    }

    return <ManageTenant tenant={row.data} />;
};
