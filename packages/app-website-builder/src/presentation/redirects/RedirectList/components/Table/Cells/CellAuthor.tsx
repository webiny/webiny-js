import React from "react";
import { RedirectListConfig } from "~/presentation/redirects/RedirectList/index.js";

export const CellAuthor = () => {
    const { useTableRow } = RedirectListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.data.createdBy.displayName}</>;
};
