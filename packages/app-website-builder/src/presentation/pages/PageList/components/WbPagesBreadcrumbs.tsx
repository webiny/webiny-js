import React from "react";
import { observer } from "mobx-react-lite";
import { Breadcrumb } from "@webiny/app-admin";
import { usePageListPresenter } from "../PageListPresenterProvider.js";
import { Routes } from "~/routes.js";

/**
 * Emits the pages-list trail (`Website Builder › Pages › <folder path>`) through the React
 * Config API. The folder path comes from the scoped folder-tree presenter, so this is a plain
 * observer that renders `<Breadcrumb>` entries; the header marks the last as current.
 */
export const WbPagesBreadcrumbs = observer(function WbPagesBreadcrumbs() {
    const presenter = usePageListPresenter();
    const foldersPresenter = presenter.folders;
    const folders = foldersPresenter.vm;

    // `getAncestorIds` walks self → root; reverse it to render root → current.
    const ancestorIds = folders.currentFolderId
        ? [...foldersPresenter.getAncestorIds(folders.currentFolderId)].reverse()
        : [];
    const titleById = new Map(folders.folders.map(folder => [folder.id, folder.title]));

    return (
        <>
            <Breadcrumb name={"wb"} label={"Website Builder"} />
            <Breadcrumb name={"wb.pages"} label={"Pages"} to={{ route: Routes.Pages.List }} />
            {ancestorIds.map(id => (
                <Breadcrumb
                    key={id}
                    name={id}
                    label={titleById.get(id) ?? "…"}
                    to={{ route: Routes.Pages.List, params: { folderId: id } }}
                />
            ))}
        </>
    );
});
