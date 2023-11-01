import React from "react";

import { ReactComponent as GridIcon } from "@material-design-icons/svg/outlined/view_module.svg";
import { ReactComponent as TableIcon } from "@material-design-icons/svg/outlined/view_list.svg";
import { i18n } from "@webiny/app/i18n";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";

const t = i18n.ns("app-file-manager/components/layout-switch");

export const LayoutSwitch = () => {
    const view = useFileManagerView();

    return (
        <Tooltip
            content={t`{mode} layout`({
                mode: view.listTable ? "Grid" : "Table"
            })}
            placement={"bottom"}
        >
            <IconButton
                icon={view.listTable ? <GridIcon /> : <TableIcon />}
                onClick={() => view.setListTable(!view.listTable)}
            >
                {t`Switch`}
            </IconButton>
        </Tooltip>
    );
};
