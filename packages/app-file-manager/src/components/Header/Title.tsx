import React, { useMemo } from "react";
import { Heading, Icon, IconButton, Skeleton, Switch } from "@webiny/admin-ui";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";
import { FolderProvider } from "@webiny/app-aco";
import { OptionsMenu } from "@webiny/app-admin";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";

export const Title = () => {
    const {
        isRootFolder,
        listTitle,
        displaySubFolders,
        setDisplaySubFolders,
        currentFolder,
        folders
    } = useFileManagerView();
    const { browser } = useFileManagerViewConfig();

    const icon = useMemo(() => {
        return isRootFolder ? <HomeIcon /> : <FolderIcon />;
    }, [isRootFolder]);

    return (
        <>
            {(listTitle && (
                <div className={"flex gap-xs items-center"}>
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
                    <div className={"flex flex-nowrap"}>
                        <Switch
                            label={"Display subfolders"}
                            labelPosition={"end"}
                            onChange={setDisplaySubFolders}
                            checked={displaySubFolders}
                            disabled={folders.length === 0}
                        />
                    </div>
                </div>
            )) || <Skeleton size={"xl"} />}
        </>
    );
};
