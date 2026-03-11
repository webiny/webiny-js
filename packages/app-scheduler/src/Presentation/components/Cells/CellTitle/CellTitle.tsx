import React from "react";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import { RowIcon, RowText, RowTitle } from "./CellTitle.styled.js";
import { SchedulerListConfig } from "~/Presentation/configs/index.js";

export const CellTitle = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return (
        <RowTitle>
            <RowIcon>
                <File />
            </RowIcon>
            <RowText use={"subtitle2"}>{row.data.title}</RowText>
        </RowTitle>
    );
};
