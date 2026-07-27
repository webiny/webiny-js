import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useBreadcrumbs, type BreadcrumbTrailItem } from "@webiny/app-admin";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { Routes } from "~/routes.js";

/**
 * Publishes the current folder path to the admin header breadcrumbs, e.g.
 * `Home › File Manager › Marketing › Demo`. Navigating an item updates the `folderId`
 * route param, which `RouteParamsSync` mirrors back into the folder tree selection.
 *
 * Rendered in page mode only (not in the overlay file picker), where the admin header bar
 * — and therefore the breadcrumbs — is present.
 */
export const FileManagerBreadcrumbs = observer(function FileManagerBreadcrumbs() {
    const presenter = useFileManagerPresenter();
    const { folders } = presenter.vm;
    const foldersActions = presenter.actions.folders;

    const trail = useMemo<BreadcrumbTrailItem[]>(() => {
        // The File Manager root ("All Files") — links to the folder-less list.
        const root: BreadcrumbTrailItem = {
            id: "fm-root",
            label: "File Manager",
            to: { route: Routes.List }
        };

        if (folders.isRootFolder || !folders.currentFolderId) {
            // At the root, "File Manager" is the current (non-navigable) location.
            return [{ ...root, to: undefined }];
        }

        // `getAncestorIds` walks self → root; reverse it to render root → current.
        const ancestorIds = [...foldersActions.getAncestorIds(folders.currentFolderId)].reverse();
        const titleById = new Map(folders.folders.map(folder => [folder.id, folder.title]));

        const folderItems = ancestorIds.map<BreadcrumbTrailItem>((id, index) => {
            const isCurrent = index === ancestorIds.length - 1;
            return {
                id,
                label: titleById.get(id) ?? "…",
                to: isCurrent ? undefined : { route: Routes.List, params: { folderId: id } }
            };
        });

        return [root, ...folderItems];
    }, [folders.isRootFolder, folders.currentFolderId, folders.folders, foldersActions]);

    useBreadcrumbs(trail);

    return null;
});
