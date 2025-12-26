import React from "react";
import { RedirectListConfig } from "~/modules/redirects/configs/index.js";

const { useTableRow, isFolderRow } = RedirectListConfig.Browser.Table.Column;

export const CellRedirectType = () => {
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const { redirectType } = row.data;

    return <>{redirectType}</>;
};
