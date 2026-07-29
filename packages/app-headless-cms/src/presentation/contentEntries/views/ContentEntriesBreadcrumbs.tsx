import React from "react";
import { observer } from "mobx-react-lite";
import { Breadcrumb } from "@webiny/app-admin";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/list/ContentEntryListConfig.js";
import { Routes } from "~/routes.js";

/**
 * Emits the content-entries trail (`<root> › <Model> › <folder path>`) through the React
 * Config API. Model and folder path come from the scoped presenter, so this is a plain
 * observer that renders `<Breadcrumb>` entries; the header marks the last as current.
 *
 * The leading root defaults to "Headless CMS" but can be overridden per app via the entries
 * list config (`Browser.BreadcrumbRoot`) — e.g. Tenant Manager, which reuses this view for the
 * tenant model, shows "Tenant Manager" instead.
 */
export const ContentEntriesBreadcrumbs = observer(function ContentEntriesBreadcrumbs() {
    const presenter = useContentEntriesPresenter();
    const { browser } = useContentEntryListConfig();
    const model = presenter.vm.model;
    const foldersPresenter = presenter.folders;
    const folders = foldersPresenter.vm;

    const root = browser.breadcrumbRoot ?? {
        label: "Headless CMS",
        to: { route: Routes.ContentModels.List }
    };

    // `getAncestorIds` walks self → root; reverse it to render root → current.
    const ancestorIds = folders.currentFolderId
        ? [...foldersPresenter.getAncestorIds(folders.currentFolderId)].reverse()
        : [];
    const titleById = new Map(folders.folders.map(folder => [folder.id, folder.title]));

    return (
        <>
            <Breadcrumb name={"cms"} label={root.label} to={root.to} />
            <Breadcrumb
                name={"cms.model"}
                label={model.name}
                to={{ route: Routes.ContentEntries.List, params: { modelId: model.modelId } }}
            />
            {ancestorIds.map(id => (
                <Breadcrumb
                    key={id}
                    name={id}
                    label={titleById.get(id) ?? "…"}
                    to={{
                        route: Routes.ContentEntries.List,
                        params: { modelId: model.modelId, folderId: id }
                    }}
                />
            ))}
        </>
    );
});
