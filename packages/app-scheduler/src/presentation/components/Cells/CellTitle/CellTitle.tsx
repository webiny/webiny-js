import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as File } from "@webiny/icons/description.svg";
import { RowIcon, RowText, RowTitle } from "./CellTitle.styled.js";
import { SchedulerListConfig } from "~/presentation/configs/index.js";

export const CellTitle = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return (
        <RowTitle>
            <RowIcon>
                <Icon
                    size={"sm"}
                    color={"neutral-strong"}
                    icon={<File />}
                    label={`Entry - ${row.data.title}`}
                />
            </RowIcon>
            <RowText size={"sm"}>{row.data.title}</RowText>
        </RowTitle>
    );
};
