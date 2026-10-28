import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { createEntry } from "~/testing/createEntry.js";
import { createFormVm } from "~/testing/createFormVm.js";
import { CmsEntryUnsavedChanges } from "./CmsEntryUnsavedChanges.js";

const createUnsavedChanges = (isDirty: boolean) => {
    const form = {
        vm: createFormVm({ entry: createEntry(), isDirty })
    } as unknown as ContentEntryFormPresenter.Interface;
    return new CmsEntryUnsavedChanges(form);
};

describe("CmsEntryUnsavedChanges", () => {
    it("blocks Request review while the form has unsaved edits", () => {
        expect(createUnsavedChanges(true).getRequestBlockReason()).toBe(
            "Save your changes before requesting a review."
        );
    });

    it("does not block a clean form", () => {
        expect(createUnsavedChanges(false).getRequestBlockReason()).toBeNull();
    });
});
