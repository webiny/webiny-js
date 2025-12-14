import React from "react";
import { Heading, Icon, IconButton, Skeleton } from "@webiny/admin-ui";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";
import { FolderProvider } from "@webiny/app-aco";
import { OptionsMenu } from "@webiny/app-admin";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";

export const Title = () => {
    const { isRootFolder, listTitle, currentFolder } = useFileManagerView();
    const { browser } = useFileManagerViewConfig();

    const icon = isRootFolder ? <HomeIcon /> : <FolderIcon />;

    if (!listTitle) {
        return (
            <div className={"flex pt-md px-md items-center"}>
                <Skeleton size={"xl"} />
            </div>
        );
    }

    return (
        <div className={"flex pt-md px-lg items-center"}>
            <div className={"flex gap-sm items-center truncate"}>
                <Icon icon={icon} label={listTitle} size={"md"} color={"neutral-strong"} />
                <Heading level={4} as={"h1"} className={"truncate"}>
                    {listTitle}
                </Heading>
            </div>
            {currentFolder && (
                <FolderProvider folder={currentFolder}>
                    <OptionsMenu
                        actions={browser.folder.actions}
                        data-testid={"folder.title.menu-action"}
                        trigger={
                            <IconButton
                                icon={<MoreVerticalIcon />}
                                size={"sm"}
                                iconSize={"lg"}
                                variant={"ghost"}
                                disabled={isRootFolder}
                            />
                        }
                    />
                </FolderProvider>
            )}
        </div>
    );
};
