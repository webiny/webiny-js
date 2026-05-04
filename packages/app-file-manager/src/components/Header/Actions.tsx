import React, { useCallback } from "react";
import { Button, type ButtonProps, IconButton, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as FileUploadIcon } from "@webiny/icons/file_upload.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_on.svg";
import { ReactComponent as TableIcon } from "@webiny/icons/format_list_bulleted.svg";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext/index.js";
import type { BrowseFilesHandler, HeaderProps } from "~/components/Header/Header.js";
import { FiltersToggle } from "@webiny/app-admin";

type ActionsProps = Pick<HeaderProps, "browseFiles">;

const FileAction = ({ browseFiles }: ActionsProps) => {
    const { vm, actions } = useFileManagerPresenter();
    const fileManager = useFileManagerApi();

    const selectedFiles = vm.list.rows.filter(f => vm.list.selection.selectedIds.has(f.id));

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

    if (vm.isOverlay && selectedFiles.length > 0) {
        return (
            <Button
                onClick={() => actions.confirmSelection()}
                size={"md"}
                text={`Select ${vm.multiple && `(${selectedFiles.length})`}`}
            />
        );
    }

    return renderUploadFileAction({
        browseFiles
    } as BrowseFilesHandler);
};

const FolderAction = () => {
    const { vm, actions } = useFileManagerPresenter();

    const onCreateFolder = useCallback(() => {
        const parentId = vm.folders.currentFolderId;
        actions.folders.createFolder(parentId ?? undefined);
    }, [vm.folders.currentFolderId]);

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
    const { vm, actions } = useFileManagerPresenter();

    const isTable = vm.viewMode === "table";

    return (
        <Tooltip
            side={"bottom"}
            content={isTable ? "Switch to Grid" : "Switch to Table"}
            trigger={
                <IconButton
                    variant={"ghost"}
                    size={"md"}
                    icon={isTable ? <GridIcon /> : <TableIcon />}
                    onClick={() => actions.setViewMode(isTable ? "grid" : "table")}
                />
            }
        />
    );
};

const ToggleFiltersAction = () => {
    const { vm, actions } = useFileManagerPresenter();

    const toggleFilters = () => {
        if (vm.showingFilters) {
            actions.hideFilters();
        } else {
            actions.showFilters();
        }
    };

    return (
        <FiltersToggle
            onFiltersToggle={toggleFilters}
            showingFilters={vm.showingFilters}
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
