import React, { useCallback } from "react";
import { Button, type ButtonProps, IconButton, Tooltip } from "@webiny/admin-ui";
import { useCreateDialog } from "@webiny/app-aco";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as FileUploadIcon } from "@webiny/icons/file_upload.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_on.svg";
import { ReactComponent as TableIcon } from "@webiny/icons/format_list_bulleted.svg";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext/index.js";
import type { BrowseFilesHandler, HeaderProps } from "~/components/Header/Header.js";
import { FiltersToggle } from "@webiny/app-admin";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";

type ActionsProps = Pick<HeaderProps, "browseFiles">;

const FileAction = ({ browseFiles }: ActionsProps) => {
    const view = useFileManagerView();
    const fileManager = useFileManagerApi();

    const renderUploadFileAction = useCallback(
        ({ browseFiles }: BrowseFilesHandler) => {
            if (!fileManager.canCreate) {
                return null;
            }
            return (
                <Button
                    onClick={browseFiles as ButtonProps["onClick"]}
                    size={"md"}
                    text={"Upload"}
                    icon={<FileUploadIcon />}
                />
            );
        },
        [fileManager.canCreate]
    );

    if (view.hasOnSelectCallback && view.selected.length > 0) {
        return (
            <Button
                onClick={() => view.onChange(view.selected)}
                size={"md"}
                text={`Select ${view.multiple && `(${view.selected.length})`}`}
            />
        );
    }

    return renderUploadFileAction({
        browseFiles
    } as BrowseFilesHandler);
};

const FolderAction = () => {
    const view = useFileManagerView();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: view.folderId });
    }, [view.folderId]);

    return (
        <Button
            variant={"secondary"}
            size={"md"}
            onClick={onCreateFolder}
            text={"New Folder"}
            icon={<AddIcon />}
            data-testid={"file-manager.create-folder-button"}
        />
    );
};

const LayoutSwitchAction = () => {
    const view = useFileManagerView();

    return (
        <Tooltip
            side={"bottom"}
            content={view.listTable ? "Switch to Grid" : "Switch to Table"}
            trigger={
                <IconButton
                    variant={"ghost"}
                    size={"md"}
                    icon={view.listTable ? <GridIcon /> : <TableIcon />}
                    onClick={() => view.setListTable(!view.listTable)}
                />
            }
        />
    );
};

const ToggleFiltersAction = () => {
    const view = useFileManagerView();

    const toggleFilters = () => {
        if (view.showingFilters) {
            view.hideFilters();
        } else {
            view.showFilters();
        }
    };

    return (
        <FiltersToggle
            onFiltersToggle={toggleFilters}
            showingFilters={view.showingFilters}
            data-testid="fm.list-entries.toggle-filters"
        />
    );
};

export const Actions = (props: ActionsProps) => {
    return (
        <div className={"h-full flex gap-sm items-center justify-end"}>
            <div className={"flex gap-xs"}>
                <ToggleFiltersAction />
                <LayoutSwitchAction />
            </div>
            <div className={"flex gap-xs"}>
                <FileAction browseFiles={props.browseFiles} />
                <FolderAction />
            </div>
        </div>
    );
};
