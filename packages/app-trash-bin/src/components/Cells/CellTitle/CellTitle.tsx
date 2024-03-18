import React from "react";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import { RowIcon, RowText, RowTitle } from "./CellTitle.styled";
import { TrashBinListConfig } from "~/configs";

export const CellTitle = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return (
        <RowTitle>
            <RowIcon>
                <File />
            </RowIcon>
            <RowText use={"subtitle2"}>{row.title}</RowText>
        </RowTitle>
    );
};
