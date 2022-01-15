import { useContext } from "react";
import { Context as ContentEntriesContext } from "~/admin/views/contentEntries/ContentEntriesContext";
import { CmsEditorField } from "~/types";

interface UseNewRefEntryParams {
    field: CmsEditorField;
}

interface UseNewRefEntry {
    renderNewEntryModal: boolean;
    renderedInPreviewTab: boolean;
    refModelId: string;
}

export const useNewRefEntry = ({ field }: UseNewRefEntryParams): UseNewRefEntry => {
    const refModelId = field.settings.models[0].modelId;

    const contentEntriesContextValue = useContext(ContentEntriesContext);

    /**
     * We don't wrap the "ContentEntryForm" with "ContentEntriesContextProvider"
     * when rendering it inside content model editor's preview tab.
     *
     * And we also don't want to have new ref field Dialog in the preview tab.
     * Therefore, we check for "contentEntriesContextValue" to know that we're inside preview tab.
     */
    const renderedInPreviewTab = contentEntriesContextValue === null;

    let renderNewEntryModal;

    if (renderedInPreviewTab) {
        renderNewEntryModal = false;
    } else {
        const { insideDialog } = contentEntriesContextValue;
        renderNewEntryModal = !insideDialog;
    }

    return {
        renderNewEntryModal,
        renderedInPreviewTab,
        refModelId
    };
};
