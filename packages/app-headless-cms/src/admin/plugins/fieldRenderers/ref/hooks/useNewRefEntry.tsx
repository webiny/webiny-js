import React, { useContext } from "react";
import { Context as ContentEntriesContext } from "~/admin/views/contentEntries/ContentEntriesContext";
import { CmsModelField } from "~/types";
import MissingEntryHelpText, {
    ReferenceMultipleModelsHelpText
} from "../components/MissingEntryHelpText";

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

    const contentEntriesContextValue = useContext(ContentEntriesContext);

    /**
     * We don't wrap the "ContentEntryForm" with "ContentEntriesContextProvider"
     * when rendering it inside content model editor's preview tab.
     *
     * And we also don't want to have new ref field Dialog in the preview tab.
     * Therefore, we check for "contentEntriesContextValue" to know that we're inside preview tab.
     */
    const renderedInPreviewTab = contentEntriesContextValue === null;

    /**
     * Set "renderNewEntryModal" value.
     */
    let renderNewEntryModal;

    if (renderedInPreviewTab) {
        renderNewEntryModal = false;
    } else if (referenceMultipleModels) {
        renderNewEntryModal = false;
    } else {
        const { insideDialog } = contentEntriesContextValue;
        renderNewEntryModal = !insideDialog;
    }
    /**
     * Set "helpText" value.
     */
    let helpText = null;
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
