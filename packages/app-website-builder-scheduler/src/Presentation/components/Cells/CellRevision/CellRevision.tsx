import React from "react";
import { RowText, RowTitle } from "./CellRevision.styled.js";
import { WbSchedulerListConfig } from "~/Presentation/configs/index.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";

export const CellRevision = () => {
    const { useTableRow } = WbSchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    const { version } = parseIdentifier(row.data.targetId);
    return (
        <RowTitle>
            <RowText use={"subtitle2"}>{version}</RowText>
        </RowTitle>
    );
};
