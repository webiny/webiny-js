import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import LazyLoad from "react-lazy-load";
import { cn, CheckboxPrimitive, Text, TimeAgo, OverlayLoader } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { FolderIcon } from "@webiny/app-aco";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";
import { useFileManagerConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { FileProvider } from "~/presentation/contexts/FileProvider.js";
import type { FmFile } from "~/features/shared/types.js";
import type { FolderDto } from "@webiny/app-aco";

const t = i18n.ns("app-file-manager/presentation/file-grid");

// ---------------------------------------------------------------------------
// FolderCard — renders a single folder in the grid.
// ---------------------------------------------------------------------------

interface FolderCardProps {
    folder: FolderDto;
    onNavigate: (folderId: string) => void;
}

const FolderCard = ({ folder, onNavigate }: FolderCardProps) => {
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
            onClick={() => onNavigate(folder.id)}
            data-testid={"fm-grid-folder-card"}
            data-folder-id={folder.id}
        >
            <div style={{ height: 150 }} className={"flex items-center justify-center"}>
                <FolderIcon width={90} height={90} />
            </div>
            <div className={"px-md py-sm-extra"}>
                <Text size={"sm"} as={"div"} className={"truncate text-neutral-primary"}>
                    {folder.title}
                </Text>
                <Text size={"sm"} as={"div"} className={"truncate text-neutral-dimmed"}>
                    {t`Folder`}
                </Text>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// FileCard — renders a single file in the grid.
// ---------------------------------------------------------------------------

interface FileCardProps {
    file: FmFile;
    selected: boolean;
    onToggle: (id: string) => void;
}

const FileCard = observer(function FileCard({ file, selected, onToggle }: FileCardProps) {
    const { browser, getThumbnailRenderer } = useFileManagerConfig();
    const { itemActions } = browser.grid;

    const renderer = getThumbnailRenderer(browser.grid.itemThumbnails, file as any);

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onToggle(file.id);
        },
        [file.id, onToggle]
    );

    return (
        <FileProvider file={file}>
            <div
                className={cn([
                    "group",
                    "bg-neutral-base rounded-lg",
                    "shadow-sm hover:shadow-lg",
                    "border-sm border-solid border-neutral-base hover:border-neutral-dimmed-darker",
                    selected && "ring-md ring-primary-strong",
                    "transition-shadow duration-250 ease-in-out",
                    "overflow-hidden"
                ])}
                data-testid={"fm-grid-file-card"}
                data-file-id={file.id}
            >
                <div onClick={handleClick} className={"relative cursor-pointer"}>
                    {/* Selection checkbox. */}
                    <div
                        className={cn([
                            "p-xs rounded-md",
                            "bg-neutral-base/30",
                            "absolute top-sm left-sm z-[1]",
                            selected ? "visible" : "invisible group-hover:visible"
                        ])}
                    >
                        <CheckboxPrimitive
                            onClick={handleClick}
                            checked={selected}
                            onChange={() => void 0}
                        />
                    </div>
                    {/* Item actions (hover). */}
                    <div
                        className={cn([
                            "invisible group-hover:visible",
                            "flex items-center gap-xxs",
                            "p-xs",
                            "absolute top-xs-plus right-xs-plus z-[1]"
                        ])}
                    >
                        {itemActions.map(action => (
                            <React.Fragment key={action.name}>{action.element}</React.Fragment>
                        ))}
                    </div>
                    {/* Thumbnail. */}
                    <LazyLoad
                        height={150}
                        offset={"300px"}
                        className={cn([
                            "bg-neutral-muted",
                            "flex items-center justify-center",
                            "text-neutral-strong text-sm"
                        ])}
                    >
                        {renderer?.element || null}
                    </LazyLoad>
                </div>
                {/* File label. */}
                <div className={"px-md py-sm-extra"}>
                    <Text size={"sm"} as={"div"} className={"truncate text-neutral-primary"}>
                        {file.name}
                    </Text>
                    <Text size={"sm"} as={"div"} className={"truncate text-neutral-dimmed"}>
                        {file.type} {" // "} <TimeAgo datetime={file.createdOn} />
                    </Text>
                </div>
            </div>
        </FileProvider>
    );
});

// ---------------------------------------------------------------------------
// FileGrid — the main grid view component.
// ---------------------------------------------------------------------------

/**
 * Grid/Gallery View component driven by FileListPresenter vm.
 * Renders file thumbnail cards and folder cards in a responsive grid layout.
 * Wires click-to-select through presenter.actions.selection.
 */
export const FileGrid = observer(function FileGrid() {
    const presenter = useFileManagerPresenter();
    const { vm, actions } = presenter;

    const childFolders = vm.folders.childFolders;

    // Handle folder navigation.
    const handleFolderNavigate = useCallback(
        (folderId: string) => {
            actions.folders.selectFolder(folderId);
        },
        [actions.filter]
    );

    // Handle file selection toggle.
    const handleToggle = useCallback(
        (id: string) => {
            actions.selection.toggle(id);
        },
        [actions.selection]
    );

    // Deselect all when clicking the grid background.
    const handleBackgroundClick = useCallback(() => {
        actions.selection.deselectAll();
    }, [actions.selection]);

    if (vm.list.pagination.loading && vm.list.rows.length === 0) {
        return (
            <div className={"relative size-full"}>
                <OverlayLoader text={t`Loading files...`} size={"lg"} />
            </div>
        );
    }

    return (
        <div
            className={cn(["p-lg", "grid gap-md"])}
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
            onClick={handleBackgroundClick}
            data-testid={"fm-file-grid"}
        >
            {vm.showFolders &&
                childFolders.map(folder => (
                    <FolderCard key={folder.id} folder={folder} onNavigate={handleFolderNavigate} />
                ))}
            {vm.list.rows.map(file => (
                <FileCard
                    key={file.id}
                    file={file}
                    selected={vm.list.selection.selectedIds.has(file.id)}
                    onToggle={handleToggle}
                />
            ))}
        </div>
    );
});
