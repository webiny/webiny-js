import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Heading, Icon, IconButton, Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as ChevronRightIcon } from "@webiny/icons/chevron_right.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/view_module.svg";
import { ReactComponent as TableIcon } from "@webiny/icons/view_list.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileListPresenter } from "../../FileListPresenterProvider.js";
import type { IFolderTreeNode } from "@webiny/app-aco/presentation/folderTree/abstractions.js";

const t = i18n.ns("app-file-manager/presentation/header");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the breadcrumb path from root to the current folder by walking up
 * the tree. Returns an array ordered from root to the current folder.
 */
const buildBreadcrumbPath = (
    currentFolder: IFolderTreeNode | null,
    tree: IFolderTreeNode[]
): IFolderTreeNode[] => {
    if (!currentFolder) {
        return [];
    }

    const path: IFolderTreeNode[] = [];
    const nodeMap = new Map<string, IFolderTreeNode>();

    // Build a flat lookup from the tree.
    const flatten = (nodes: IFolderTreeNode[]) => {
        for (const node of nodes) {
            nodeMap.set(node.id, node);
            flatten(node.children);
        }
    };
    flatten(tree);

    // Walk up from current folder to root.
    let cursor: IFolderTreeNode | undefined = currentFolder;
    while (cursor) {
        path.unshift(cursor);
        cursor = cursor.parentId ? nodeMap.get(cursor.parentId) : undefined;
    }

    return path;
};

// ---------------------------------------------------------------------------
// LayoutSwitch — toggles between table and grid view modes.
// ---------------------------------------------------------------------------

interface LayoutSwitchProps {
    viewMode: "table" | "grid";
    onSwitch: (mode: "table" | "grid") => void;
}

const LayoutSwitch = ({ viewMode, onSwitch }: LayoutSwitchProps) => {
    const nextMode = viewMode === "table" ? "grid" : "table";

    return (
        <Tooltip
            side={"bottom"}
            trigger={
                <IconButton
                    icon={viewMode === "table" ? <GridIcon /> : <TableIcon />}
                    onClick={() => onSwitch(nextMode)}
                    data-testid={"fm-header-layout-switch"}
                />
            }
            content={viewMode === "table" ? t`Grid layout` : t`Table layout`}
        />
    );
};

// ---------------------------------------------------------------------------
// FolderBreadcrumb — renders the folder path from root to current folder.
// ---------------------------------------------------------------------------

interface FolderBreadcrumbProps {
    currentFolder: IFolderTreeNode | null;
    tree: IFolderTreeNode[];
    onNavigate: (folderId: string | null) => void;
}

const FolderBreadcrumb = ({ currentFolder, tree, onNavigate }: FolderBreadcrumbProps) => {
    const path = useMemo(() => buildBreadcrumbPath(currentFolder, tree), [currentFolder, tree]);

    return (
        <div className={"flex items-center gap-xs truncate"}>
            {/* Root link. */}
            <button
                className={
                    "flex items-center gap-xs cursor-pointer bg-transparent border-none p-none"
                }
                onClick={() => onNavigate(null)}
                data-testid={"fm-breadcrumb-root"}
            >
                <Icon icon={<HomeIcon />} label={t`Home`} size={"sm"} color={"neutral-strong"} />
                {path.length === 0 && (
                    <Heading level={4} as={"h1"} className={"truncate"}>
                        {t`File Manager`}
                    </Heading>
                )}
            </button>

            {/* Folder segments. */}
            {path.map((folder, index) => {
                const isLast = index === path.length - 1;
                return (
                    <React.Fragment key={folder.id}>
                        <Icon
                            icon={<ChevronRightIcon />}
                            label={""}
                            size={"sm"}
                            color={"neutral-strong"}
                        />
                        {isLast ? (
                            <div className={"flex items-center gap-xs"}>
                                <Icon
                                    icon={<FolderIcon />}
                                    label={folder.name}
                                    size={"md"}
                                    color={"neutral-strong"}
                                />
                                <Heading level={4} as={"h1"} className={"truncate"}>
                                    {folder.name}
                                </Heading>
                            </div>
                        ) : (
                            <button
                                className={
                                    "flex items-center gap-xs cursor-pointer bg-transparent border-none p-none"
                                }
                                onClick={() => onNavigate(folder.id)}
                                data-testid={`fm-breadcrumb-folder-${folder.id}`}
                            >
                                <Text
                                    size={"sm"}
                                    className={
                                        "truncate text-neutral-dimmed hover:text-neutral-primary"
                                    }
                                >
                                    {folder.name}
                                </Text>
                            </button>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ---------------------------------------------------------------------------
// FileManagerHeader — main header component.
// ---------------------------------------------------------------------------

/**
 * Header component for the File Manager list view.
 * Renders a folder breadcrumb and a layout switch (table/grid).
 * Reads vm.viewMode and vm.folders.currentFolder from the FileListPresenter.
 */
export const FileManagerHeader = observer(function FileManagerHeader() {
    const { vm, actions } = useFileListPresenter();

    // Navigate to a folder via the breadcrumb.
    const handleNavigate = useCallback(
        (folderId: string | null) => {
            if (folderId) {
                actions.filter.set("folderId", folderId);
            } else {
                actions.filter.clear("folderId");
            }
        },
        [actions.filter]
    );

    return (
        <div className={"flex pt-md px-lg items-center justify-between"} data-testid={"fm-header"}>
            <FolderBreadcrumb
                currentFolder={vm.folders.currentFolder}
                tree={vm.folders.tree}
                onNavigate={handleNavigate}
            />
            <LayoutSwitch viewMode={vm.viewMode} onSwitch={actions.setViewMode} />
        </div>
    );
});
