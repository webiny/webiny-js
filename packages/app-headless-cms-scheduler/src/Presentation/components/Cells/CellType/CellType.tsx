import React from "react";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import { RowIcon, RowText, RowType } from "./CellType.styled";
import { SchedulerListConfig } from "~/Presentation/configs";

export const CellType = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return (
        <RowType>
            <RowIcon>
                <File />
            </RowIcon>
            <RowText use={"subtitle2"}>{row.type}</RowText>
        </RowType>
    );
};
