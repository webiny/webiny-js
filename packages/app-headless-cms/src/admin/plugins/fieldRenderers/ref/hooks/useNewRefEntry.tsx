import React from "react";
import { CmsModelField } from "~/types";
import MissingEntryHelpText, {
    ReferenceMultipleModelsHelpText
} from "../components/MissingEntryHelpText";
import { useContentEntries } from "~/admin/views/contentEntries/hooks/useContentEntries";

interface UseNewRefEntryParams {
    field: CmsModelField;
}

interface UseNewRefEntry {
    renderNewEntryModal: boolean;
    refModelId: string;
    helpText: React.ReactElement;
}

export const useNewRefEntry = ({ field }: UseNewRefEntryParams): UseNewRefEntry => {
    const models = (field.settings && field.settings.models ? field.settings.models : null) || [];
    const [{ modelId: refModelId }] = models;
    const referenceMultipleModels = models.length > 1;

    let contentEntriesContext = null;
    try {
        contentEntriesContext = useContentEntries();
    } catch {
        // Means there's no `ContentEntriesContextProvider`, so we must be in model editor "preview".
    }

    /**
     * We don't wrap the "ContentEntryForm" with "ContentEntriesContextProvider"
     * when rendering it inside content model editor's preview tab.
     *
     * And we also don't want to have new ref field Dialog in the preview tab.
     * Therefore, we check for "contentEntriesContext" to know that we're inside preview tab.
     */
    const renderedInPreviewTab = contentEntriesContext === null;

    let renderNewEntryModal = false;

    if (renderedInPreviewTab) {
        renderNewEntryModal = false;
    } else if (referenceMultipleModels) {
        renderNewEntryModal = false;
    } else if (contentEntriesContext) {
        renderNewEntryModal = !contentEntriesContext.insideDialog;
    }
    /**
     * Set "helpText" value.
     */
    let helpText;
    if (referenceMultipleModels) {
        helpText = <ReferenceMultipleModelsHelpText />;
    } else {
        helpText = <MissingEntryHelpText refModelId={refModelId} />;
    }

    return {
        renderNewEntryModal,
        refModelId,
        helpText
    };
};
