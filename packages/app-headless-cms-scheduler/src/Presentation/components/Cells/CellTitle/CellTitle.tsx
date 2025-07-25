import React from "react";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import { RowIcon, RowText, RowTitle } from "./CellTitle.styled";
import { SchedulerListConfig } from "~/Presentation/configs";

export const CellTitle = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
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
