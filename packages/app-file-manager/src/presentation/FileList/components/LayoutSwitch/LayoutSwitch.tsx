import React from "react";
import { IconButton, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as GridIcon } from "@webiny/icons/view_module.svg";
import { ReactComponent as TableIcon } from "@webiny/icons/view_list.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";

const t = i18n.ns("app-file-manager/components/layout-switch");

export const LayoutSwitch = () => {
    const { vm, actions } = useFileManagerPresenter();
    const isTable = vm.viewMode === "table";

    return (
        <Tooltip
            side={"bottom"}
            trigger={
                <IconButton
                    icon={isTable ? <GridIcon /> : <TableIcon />}
                    onClick={() => actions.setViewMode(isTable ? "grid" : "table")}
                />
            }
            content={t`{mode} layout`({
                mode: isTable ? "Grid" : "Table"
            })}
        />
    );
};
