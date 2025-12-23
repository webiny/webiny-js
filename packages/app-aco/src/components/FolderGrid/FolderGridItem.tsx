import React from "react";
import { cn, IconButton, Text, TimeAgo, Icon } from "@webiny/admin-ui";
import { FolderIcon, FolderSharedIcon } from "../FolderIcons/index.js";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { OptionsMenu } from "@webiny/app-admin";
import type { FolderActionConfig } from "~/config/index.js";
import { useFolder } from "~/hooks/index.js";

export interface FolderGridItemProps {
    folderActions: FolderActionConfig[];
    onClick: (id: string) => void;
}

export const FolderGridItem = ({ folderActions, onClick }: FolderGridItemProps) => {
    const { folder } = useFolder();
    const { id, title, hasNonInheritedPermissions, canManagePermissions, canManageStructure } =
        folder;

    let icon = <Icon icon={<FolderIcon />} label={folder.title} className={"w-[90px] h-[90px]"} />;
    if (hasNonInheritedPermissions && canManagePermissions) {
        icon = (
            <Icon
                icon={<FolderSharedIcon />}
                label={folder.title}
                className={"w-[90px] h-[90px]"}
            />
        );
    }

    return (
        <div
            className={cn([
                "group",
                "bg-neutral-base rounded-lg",
                "shadow-sm hover:shadow-lg",
                "border-sm border-solid border-neutral-base hover:border-neutral-dimmed-darker",
                "transition-shadow duration-250 ease-in-out",
                "overflow-hidden",
                "cursor-pointer"
            ])}
            onClick={() => onClick(id)}
        >
            <div style={{ height: 150 }} className={"relative"}>
                <div
                    className={cn([
                        "absolute top-0 left-0",
                        "w-full h-full",
                        "flex items-center justify-center"
                    ])}
                >
                    {icon}
                </div>
                {canManageStructure && (
                    <div
                        className={cn([
                            "invisible group-hover:visible",
                            "flex items-center gap-xxs",
                            "p-xs",
                            "absolute top-xs-plus right-xs-plus"
                        ])}
                    >
                        <OptionsMenu
                            actions={folderActions}
                            data-testid={"folder.grid.menu-action"}
                            trigger={
                                <IconButton
                                    icon={<MoreVerticalIcon />}
                                    size={"sm"}
                                    variant={"ghost"}
                                />
                            }
                        />
                    </div>
                )}
            </div>
            <div className={"px-md py-sm-extra"} data-testid={"fm-file-wrapper-file-label"}>
                <Text size={"sm"} as={"div"} className={"truncate text-neutral-primary"}>
                    {title}
                </Text>
                <Text size={"sm"} as={"div"} className={"truncate text-neutral-dimmed"}>
                    {"Folder"} / <TimeAgo datetime={folder.createdOn} />
                </Text>
            </div>
        </div>
    );
};
