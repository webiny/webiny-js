import { useEffect, useRef } from "react";
import { reaction } from "mobx";
import { useLocalStorage } from "@webiny/app";
import { useRoute } from "@webiny/app/presentation/router/hooks/useRoute.js";
import { Routes } from "~/routes.js";
import { createLastVisitedFolderKey } from "~/admin/constants.js";
import { useContentEntriesPresenter } from "./ContentEntriesPresenterProvider.js";

interface RouteParamsSyncProps {
    modelId: string;
}

export const RouteParamsSync = ({ modelId }: RouteParamsSyncProps) => {
    const presenter = useContentEntriesPresenter();
    const localStorage = useLocalStorage();
    const { route, setRouteParams, replaceRouteParams } = useRoute(Routes.ContentEntries.List);
    const syncingFromUrl = useRef(false);

    // URL → Presenter: sync route params back to presenter on browser navigation.
    useEffect(() => {
        const urlNew = route.params.new;
        const urlId = route.params.id as string | undefined;
        const currentId = presenter.vm.selectedEntryId;

        syncingFromUrl.current = true;

        if (urlNew && currentId !== "new") {
            presenter.createEntry();
        } else if (urlId && currentId !== urlId) {
            presenter.selectEntry(urlId);
        } else if (!urlNew && !urlId && currentId !== null) {
            presenter.deselectEntry();
        }

        queueMicrotask(() => {
            syncingFromUrl.current = false;
        });
    }, [route.params.new, route.params.id]);

    // Presenter → URL: entry selection changes.
    useEffect(() => {
        return reaction(
            () => presenter.vm.selectedEntryId,
            selectedEntryId => {
                const isNew = selectedEntryId === "new";
                const entryId = selectedEntryId !== null && !isNew ? selectedEntryId : undefined;
                const update = syncingFromUrl.current ? replaceRouteParams : setRouteParams;

                update((params: Record<string, unknown>) => ({
                    ...params,
                    new: isNew || undefined,
                    id: entryId
                }));
            }
        );
    }, []);

    // Presenter → URL: folder and search changes.
    useEffect(() => {
        return reaction(
            () => ({
                folderId: presenter.folders.vm.currentFolderId,
                search: presenter.list.vm.search
            }),
            ({ folderId, search }) => {
                const storageKey = createLastVisitedFolderKey(modelId);
                if (folderId) {
                    localStorage.set(storageKey, folderId);
                } else {
                    localStorage.remove(storageKey);
                }

                const update = syncingFromUrl.current ? replaceRouteParams : setRouteParams;

                update((params: Record<string, unknown>) => ({
                    ...params,
                    folderId: folderId ?? undefined,
                    search: search || undefined
                }));
            },
            { equals: (a, b) => a.folderId === b.folderId && a.search === b.search }
        );
    }, []);

    return null;
};
