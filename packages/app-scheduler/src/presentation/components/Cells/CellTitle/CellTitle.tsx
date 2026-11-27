import React from "react";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import { Text } from "@webiny/admin-ui";
import { SchedulerListConfig } from "~/presentation/configs/index.js";

export const CellTitle = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return (
        <div className={"flex items-center"}>
            <div className={"mr-sm h-lg"}>
                <File />
            </div>
            <Text size={"sm"} className={"truncate"}>
                {row.data.title}
            </Text>
        </div>
    );
};
