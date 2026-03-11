import React from "react";
import { RowText, RowTitle } from "./CellRevision.styled.js";
import { SchedulerListConfig } from "~/Presentation/configs/index.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";

export const CellRevision = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    const { version } = parseIdentifier(row.data.targetId);
    return (
        <RowTitle>
            <RowText use={"subtitle2"}>{version}</RowText>
        </RowTitle>
    );
};
