import React from "react";
import { ReactComponent as Publish } from "@webiny/icons/publish.svg";
import { ReactComponent as Unpublish } from "@webiny/icons/unpublished.svg";
import { RowIcon, RowText, RowType } from "./CellType.styled.js";
import { WbSchedulerListConfig } from "~/Presentation/configs/index.js";

export const CellType = () => {
    const { useTableRow } = WbSchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return (
        <RowType>
            <RowIcon>{row.data.type === "publish" ? <Publish /> : <Unpublish />}</RowIcon>
            <RowText use={"subtitle2"}>{row.data.type}</RowText>
        </RowType>
    );
};
