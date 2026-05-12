import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Button, Heading, Icon, IconButton, Skeleton, Tooltip } from "@webiny/admin-ui";
import { Filters, type FiltersOnSubmit, FiltersToggle, OptionsMenu } from "@webiny/app-admin";
import { FolderProvider } from "@webiny/app-aco";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as FileUploadIcon } from "@webiny/icons/file_upload.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_on.svg";
import { ReactComponent as TableIcon } from "@webiny/icons/format_list_bulleted.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";
import { useFileManagerConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { SearchBar } from "../Search/SearchBar.js";

const t = i18n.ns("app-file-manager/presentation/header");

const Title = observer(function Title() {
    const { vm } = useFileManagerPresenter();
    const { browser } = useFileManagerConfig();
    const { currentFolder, isRootFolder, currentFolderTitle } = vm.folders;

    const icon = useMemo(() => {
        return isRootFolder ? <HomeIcon /> : <FolderIcon />;
    }, [isRootFolder]);

    if (!currentFolderTitle) {
        return <Skeleton size={"xl"} />;
    }

    return (
        <div className={"flex gap-xs items-center"}>
            <div className={"flex gap-sm items-center truncate"}>
                <Icon icon={icon} label={currentFolderTitle} size={"md"} color={"neutral-strong"} />
                <Heading level={4} as={"h1"} className={"truncate"}>
                    {currentFolderTitle}
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
});

export interface FileManagerHeaderProps {
    browseFiles?: () => void;
}

export const FileManagerHeader = observer(function FileManagerHeader({
    browseFiles
}: FileManagerHeaderProps) {
    const { vm, actions } = useFileManagerPresenter();
    const { browser } = useFileManagerConfig();

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        const convertedFilters = browser.filtersToWhere.reduce(
            (
                current: Record<string, unknown>,
                converter: (d: Record<string, unknown>) => Record<string, unknown>
            ) => converter(current),
            data as Record<string, unknown>
        );

        for (const [key, value] of Object.entries(convertedFilters)) {
            if (value === undefined || value === null || value === "") {
                actions.filter.clear(key);
            } else {
                actions.filter.set(key, value);
            }
        }
    };

    return (
        <div data-testid={"fm-header"}>
            <div className={"pl-lg pr-md py-sm-extra flex items-center justify-between"}>
                <Title />
            </div>
            <div className={"px-md py-xs flex items-center gap-sm"}>
                <SearchBar />
                <FiltersToggle
                    onFiltersToggle={() =>
                        vm.showingFilters ? actions.hideFilters() : actions.showFilters()
                    }
                    showingFilters={vm.showingFilters}
                    data-testid="fm.list-entries.toggle-filters"
                />
                <Tooltip
                    side={"bottom"}
                    content={vm.viewMode === "table" ? t`Switch to Grid` : t`Switch to Table`}
                    trigger={
                        <IconButton
                            variant={"ghost"}
                            size={"md"}
                            icon={vm.viewMode === "table" ? <GridIcon /> : <TableIcon />}
                            onClick={() =>
                                actions.setViewMode(vm.viewMode === "table" ? "grid" : "table")
                            }
                            data-testid={"fm-header-layout-switch"}
                        />
                    }
                />
                {vm.permissions.canCreate && (
                    <Button
                        variant={"secondary"}
                        size={"md"}
                        onClick={() =>
                            actions.folders.createFolder(vm.folders.currentFolderId ?? undefined)
                        }
                        text={t`New Folder`}
                        icon={<AddIcon />}
                        data-testid={"fm-header-new-folder-button"}
                    />
                )}
                {browseFiles && vm.permissions.canCreate && (
                    <Button
                        onClick={browseFiles}
                        size={"md"}
                        text={t`Upload`}
                        icon={<FileUploadIcon />}
                        data-testid={"fm-header-upload-button"}
                    />
                )}
            </div>
            <Filters filters={browser.filters} show={vm.showingFilters} onChange={applyFilters} />
        </div>
    );
});
