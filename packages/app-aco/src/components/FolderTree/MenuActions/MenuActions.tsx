import React from "react";
import { OptionsMenu } from "@webiny/app-admin";
import { cn, IconButton } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { useAcoConfig } from "~/config";
import { useFolder } from "~/hooks";

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
                "wby-invisible group-hover:wby-visible",
                "wby-size-md wby-cursor-pointer",
                "wby-absolute wby-top-1/2  wby-right-sm wby--translate-y-1/2"
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
