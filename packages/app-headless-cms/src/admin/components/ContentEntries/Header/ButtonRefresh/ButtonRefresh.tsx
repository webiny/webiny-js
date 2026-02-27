import React from "react";
import { IconButton, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as RefreshIcon } from "@webiny/icons/autorenew.svg";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks/index.js";

export const ButtonRefresh = () => {
    const list = useContentEntriesList();

    return (
        <Tooltip
            side={"bottom"}
            content={"Refresh list"}
            trigger={<IconButton variant={"ghost"} icon={<RefreshIcon />} onClick={list.refresh} />}
        />
    );
};
