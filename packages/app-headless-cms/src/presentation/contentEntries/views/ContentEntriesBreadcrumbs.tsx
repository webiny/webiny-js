import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useBreadcrumbs } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
import { Routes } from "~/routes.js";

/**
 * Publishes the content-entries location to the admin header breadcrumbs, e.g.
 * `Home › Headless CMS › Articles › Marketing`. The model and folder path both live in the
 * per-mount scoped container, so this is driven by the `useBreadcrumbs` hook rather than a
 * DI `Breadcrumb` (which resolves from the root container and can't see scoped state).
 */
export const ContentEntriesBreadcrumbs = observer(function ContentEntriesBreadcrumbs() {
    const presenter = useContentEntriesPresenter();
    const model = presenter.vm.model;
    const foldersPresenter = presenter.folders;
    const folders = foldersPresenter.vm;

    const trail = useMemo<BreadcrumbTrailItem[]>(() => {
        const items: BreadcrumbTrailItem[] = [
            { id: "cms", label: "Headless CMS", to: { route: Routes.ContentModels.List } },
            {
                id: "model",
                label: model.name,
                to: { route: Routes.ContentEntries.List, params: { modelId: model.modelId } }
            }
        ];

        // Append the folder path (root → current), same walk as the File Manager.
        if (folders.currentFolderId) {
            const ancestorIds = [
                ...foldersPresenter.getAncestorIds(folders.currentFolderId)
            ].reverse();
            const titleById = new Map(folders.folders.map(folder => [folder.id, folder.title]));
            for (const id of ancestorIds) {
                items.push({
                    id,
                    label: titleById.get(id) ?? "…",
                    to: {
                        route: Routes.ContentEntries.List,
                        params: { modelId: model.modelId, folderId: id }
                    }
                });
            }
        }

        // The last item is the current location — strip its link.
        const lastIndex = items.length - 1;
        items[lastIndex] = { ...items[lastIndex], to: undefined };

        return items;
    }, [model.modelId, model.name, folders.currentFolderId, folders.folders, foldersPresenter]);

    useBreadcrumbs(trail);

    return null;
});
