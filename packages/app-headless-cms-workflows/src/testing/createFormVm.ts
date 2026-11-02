import type { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { createEntry } from "./createEntry.js";
import { MODEL } from "./models.js";

export function createFormVm(
    overrides: Partial<ContentEntryFormPresenter.ViewModel> = {}
): ContentEntryFormPresenter.ViewModel {
    return {
        loading: null,
        entry: createEntry(),
        canCreateNewRevision: false,
        model: MODEL,
        form: null,
        status: "draft",
        canSave: true,
        canPublish: true,
        canUnpublish: false,
        canDelete: true,
        isNewEntry: false,
        isDirty: false,
        ...overrides
    };
}
