import React from "react";
import { Text } from "@webiny/admin-ui";
import { SchedulerListConfig } from "~/presentation/configs/index.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";

export const CellRevision = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    const { version } = parseIdentifier(row.data.targetId);
    return (
        <div className={"flex items-center"}>
            <Text size={"sm"} className={"truncate"}>
                {version}
            </Text>
        </div>
    );
};
