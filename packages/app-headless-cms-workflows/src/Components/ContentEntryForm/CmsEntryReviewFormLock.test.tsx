import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { ContentEntryForm } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { CmsEntryReviewFormLock } from "./CmsEntryReviewFormLock.js";
import { CmsEntryFormFieldLock } from "~/features/formFieldLock/abstractions.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { FAILED } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";

function renderForm(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({
        ...params,
        children: (
            <>
                <CmsEntryReviewFormLock />
                <ContentEntryForm />
            </>
        )
    });
}

async function findWrapper(): Promise<HTMLFieldSetElement> {
    await waitFor(() => expect(document.querySelector("fieldset")).not.toBeNull());
    return document.querySelector("fieldset") as HTMLFieldSetElement;
}

describe("CmsEntryReviewFormLock", () => {
    it.each([
        ["loading", LOADING],
        ["failed", FAILED],
        ["in review", IN_REVIEW]
    ])("makes the form read-only while the status is %s", async (_name, reviewVm) => {
        renderForm({ reviewVm });

        const wrapper = await findWrapper();

        expect(wrapper.disabled).toBe(true);
        expect(wrapper.inert).toBe(true);
    });

    it.each([
        ["no workflow", NO_WORKFLOW],
        ["a bound workflow and no review", BOUND_NO_REVIEW]
    ])("leaves the form editable for %s", async (_name, reviewVm) => {
        renderForm({ reviewVm });

        const wrapper = await findWrapper();

        expect(wrapper.disabled).toBe(false);
        expect(wrapper.inert).toBe(false);
    });

    it("keeps the same wrapper element when the lock toggles, so the form does not remount", async () => {
        const view = renderForm({ reviewVm: LOADING });
        const before = await findWrapper();

        act(() => {
            view.setVm(BOUND_NO_REVIEW);
        });

        const after = await findWrapper();
        expect(after).toBe(before);
        expect(after.disabled).toBe(false);
        expect(after.inert).toBe(false);
    });

    it("leaves a new entry editable while nothing is known", async () => {
        renderForm({ formVm: { entry: null, isNewEntry: true }, reviewVm: LOADING });

        const wrapper = await findWrapper();

        expect(wrapper.disabled).toBe(false);
    });

    it("leaves a singleton model editable", async () => {
        renderForm({ formVm: { model: SINGLETON_MODEL }, reviewVm: LOADING });

        const wrapper = await findWrapper();

        expect(wrapper.disabled).toBe(false);
    });

    it("locks the form fields while the review locks the form, so field controls hide too", async () => {
        const view = renderForm({ reviewVm: IN_REVIEW });
        const fieldLock = view.container.resolve(CmsEntryFormFieldLock);

        await waitFor(() => expect(fieldLock.isLocked).toBe(true));

        act(() => {
            view.setVm(BOUND_NO_REVIEW);
        });

        await waitFor(() => expect(fieldLock.isLocked).toBe(false));
    });

    it("leaves the form fields unlocked for a new entry", async () => {
        const view = renderForm({ formVm: { entry: null, isNewEntry: true }, reviewVm: LOADING });
        const fieldLock = view.container.resolve(CmsEntryFormFieldLock);

        await findWrapper();

        expect(fieldLock.isLocked).toBe(false);
    });

    it("releases the form fields when the editor closes", async () => {
        const view = renderForm({ reviewVm: IN_REVIEW });
        const fieldLock = view.container.resolve(CmsEntryFormFieldLock);
        await waitFor(() => expect(fieldLock.isLocked).toBe(true));

        cleanup();

        expect(fieldLock.isLocked).toBe(false);
    });
});
