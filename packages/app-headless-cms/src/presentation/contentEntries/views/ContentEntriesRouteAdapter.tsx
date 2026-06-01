import React from "react";
import { useRoute } from "@webiny/app-admin";
import { Routes } from "~/routes.js";
import { ContentEntriesView } from "./ContentEntriesView.js";

export const ContentEntriesRouteAdapter = () => {
    const { route } = useRoute(Routes.ContentEntries.List);
    const { modelId } = route.params;

    if (!modelId) {
        return null;
    }

    return <ContentEntriesView modelId={modelId} />;
};
