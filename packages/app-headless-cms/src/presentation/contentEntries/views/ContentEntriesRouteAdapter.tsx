import React from "react";
import { useRoute } from "@webiny/app-admin";
import { useLocalStorage } from "@webiny/app";
import { Routes } from "~/routes.js";
import { createLastVisitedFolderKey } from "~/admin/constants.js";
import { ContentEntriesView } from "./ContentEntriesView.js";

export const ContentEntriesRouteAdapter = () => {
    const { route } = useRoute(Routes.ContentEntries.List);
    const localStorage = useLocalStorage();
    const { modelId, folderId: urlFolderId, search } = route.params;

    if (!modelId) {
        return null;
    }

    const storageKey = createLastVisitedFolderKey(modelId);
    const initialFolderId = urlFolderId ?? localStorage.get<string>(storageKey) ?? undefined;

    return (
        <ContentEntriesView
            modelId={modelId}
            initialFolderId={initialFolderId}
            initialSearch={search}
            syncToUrl
        />
    );
};
