import React from "react";
import { OptionsMenu } from "@webiny/app-admin";
import { cn, IconButton } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { useAcoConfig } from "~/config/index.js";
import { useFolder } from "~/hooks/index.js";

export const MenuActions = () => {
    const { folder } = useFolder();
    const { folder: folderConfig } = useAcoConfig();

    // If the user cannot manage folder structure, no need to show the menu.
    if (!folder.canManageStructure) {
        return null;
    }

    return (
        <div
            // Let's stop click event propagation, otherwise opening the OptionsMenu event will propagate up to the main Tree Item
            onClick={e => e.stopPropagation()}
            className={cn(
                "invisible group-hover:visible",
                "size-md cursor-pointer",
                "absolute top-1/2  right-sm -translate-y-1/2"
            )}
        >
            <OptionsMenu
                trigger={<IconButton icon={<MoreVerticalIcon />} size={"xs"} variant={"ghost"} />}
                actions={folderConfig.actions}
                data-testid={"folder.tree.menu-action"}
            />
        </div>
    );
};
