import React from "react";
import { ReactComponent as Publish } from "@webiny/icons/publish.svg";
import { ReactComponent as Unpublish } from "@webiny/icons/unpublished.svg";
import { Text } from "@webiny/admin-ui";
import { SchedulerListConfig } from "~/presentation/configs/index.js";

export const CellActionType = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return (
        <div className={"flex items-center"}>
            <div className={"mr-sm h-lg"}>
                {row.data.actionType === "publish" ? <Publish /> : <Unpublish />}
            </div>
            <Text size={"sm"} className={"truncate"}>
                {row.data.actionType}
            </Text>
        </div>
    );
};
