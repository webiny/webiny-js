import React from "react";
import { ReactComponent as File } from "@webiny/icons/description.svg";
import { TrashBinListConfig } from "../../configs/index.js";
import { Icon, Text } from "@webiny/admin-ui";

export const CellTitle = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return (
        <div className={"flex items-center gap-sm truncate"}>
            <Icon size={"sm"} color={"neutral-strong"} icon={<File />} label={"Item"} />
            <Text className={"truncate min-w-0 shrink"}>{row.data.title}</Text>
        </div>
    );
};
