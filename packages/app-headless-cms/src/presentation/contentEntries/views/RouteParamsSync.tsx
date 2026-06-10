import { useEffect } from "react";
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
    const { setRouteParams } = useRoute(Routes.ContentEntries.List);

    useEffect(() => {
        return reaction(
            () => ({
                folderId: presenter.folders.vm.currentFolderId,
                search: presenter.list.vm.search,
                selectedEntryId: presenter.vm.selectedEntryId
            }),
            ({ folderId, search, selectedEntryId }) => {
                const storageKey = createLastVisitedFolderKey(modelId);
                if (folderId) {
                    localStorage.set(storageKey, folderId);
                } else {
                    localStorage.remove(storageKey);
                }

                const isNew = selectedEntryId === "new";
                const entryId = selectedEntryId !== null && !isNew ? selectedEntryId : undefined;

                setRouteParams((params: Record<string, unknown>) => ({
                    ...params,
                    folderId: folderId ?? undefined,
                    search: search || undefined,
                    new: isNew || undefined,
                    id: entryId
                }));
            },
            {
                equals: (a, b) =>
                    a.folderId === b.folderId &&
                    a.search === b.search &&
                    a.selectedEntryId === b.selectedEntryId
            }
        );
    }, []);

    return null;
};
