import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as Publish } from "@webiny/icons/publish.svg";
import { ReactComponent as Unpublish } from "@webiny/icons/unpublished.svg";
import { RowIcon, RowText, RowType } from "./CellActionType.styled.js";
import { SchedulerListConfig } from "~/presentation/configs/index.js";

export const CellActionType = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return (
        <RowType>
            <RowIcon>
                <Icon
                    size={"sm"}
                    color={"neutral-strong"}
                    icon={row.data.actionType === "publish" ? <Publish /> : <Unpublish />}
                    label={row.data.actionType === "publish" ? "Publish" : "Unpublish"}
                />
            </RowIcon>
            <RowText size={"sm"}>{row.data.actionType}</RowText>
        </RowType>
    );
};
