import React from "react";
import { RowText, RowTitle } from "./CellRevision.styled";
import { SchedulerListConfig } from "~/Presentation/configs";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";

export const CellRevision = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    const { version } = parseIdentifier(row.id);
    return (
        <RowTitle>
            <RowText use={"subtitle2"}>{version}</RowText>
        </RowTitle>
    );
};
