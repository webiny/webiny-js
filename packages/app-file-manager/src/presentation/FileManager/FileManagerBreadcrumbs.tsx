import React from "react";
import { observer } from "mobx-react-lite";
import { Breadcrumb } from "@webiny/app-admin";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { Routes } from "~/routes.js";

/**
 * Emits the current folder path as breadcrumbs (`File Manager › Marketing › Demo`) through the
 * React Config API. Dynamic values (folder titles) come from the scoped folder-tree VM, so
 * this is a plain observer component that renders `<Breadcrumb>` config entries — the header
 * marks the last one as the current location automatically.
 *
 * Rendered in page mode only (not the overlay file picker), where the admin header exists.
 */
export const FileManagerBreadcrumbs = observer(function FileManagerBreadcrumbs() {
    const presenter = useFileManagerPresenter();
    const { folders } = presenter.vm;
    const foldersActions = presenter.actions.folders;

    // `getAncestorIds` walks self → root; reverse it to render root → current.
    const ancestorIds = folders.currentFolderId
        ? [...foldersActions.getAncestorIds(folders.currentFolderId)].reverse()
        : [];
    const titleById = new Map(folders.folders.map(folder => [folder.id, folder.title]));

    return (
        <>
            <Breadcrumb name={"fm-root"} label={"File Manager"} to={{ route: Routes.List }} />
            {ancestorIds.map(id => (
                <Breadcrumb
                    key={id}
                    name={id}
                    label={titleById.get(id) ?? "…"}
                    to={{ route: Routes.List, params: { folderId: id } }}
                />
            ))}
        </>
    );
});
