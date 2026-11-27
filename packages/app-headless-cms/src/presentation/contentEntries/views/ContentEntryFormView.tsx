import React, { useEffect } from "react";
import { useRouter } from "@webiny/app";
import { createReactiveComponent, useRoute } from "@webiny/app-admin";
import { useContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { Routes } from "~/routes.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { ContentEntryEditorBody } from "./ContentEntryEditorBody.js";

/**
 * The entry editor next to the entry list: reads the entry, folder and model from the list.
 */
export const ContentEntryFormView = createReactiveComponent(() => {
    const listPresenter = useContentEntriesPresenter();
    const formPresenter = useContentEntryFormPresenter();
    const { newEntryWizard } = useContentEntryEditorConfig();
    const router = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);

    const entryId = listPresenter.vm.selectedEntryId;

    useEffect(() => {
        if (entryId !== "new") {
            return;
        }
        // Wizards start the entry later, so the folder is set for them too.
        formPresenter.setFolderId(listPresenter.folders.vm.currentFolderId);
        if (!newEntryWizard) {
            formPresenter.newEntry();
        }
    }, [entryId]);

    const handleBack = () => {
        const { modelId, folderId } = route.params;
        router.goToRoute(Routes.ContentEntries.List, { modelId, folderId });
    };

    return (
        <ContentEntryEditorBody
            entryId={entryId}
            modelName={listPresenter.vm.model.name}
            onBack={handleBack}
        />
    );
});
