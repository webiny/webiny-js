import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { CmsEntryReviewBlockedActions } from "./CmsEntryReviewBlockedActions.js";
import { MODEL } from "~/testing/models.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { createEntry } from "~/testing/createEntry.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { APPROVED } from "~/testing/reviewStates.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { BOUND_UNPUBLISHED } from "~/testing/reviewStates.js";
import { CHECKING } from "~/testing/reviewStates.js";
import { FAILED } from "~/testing/reviewStates.js";
import { FAILED_REASON } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { IN_REVIEW_REASON } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NEEDS_REVIEW } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";
import { REJECTED } from "~/testing/reviewStates.js";
import { REJECTED_REASON } from "~/testing/reviewStates.js";

const permission = vi.hoisted(() => {
    return { canPublish: true };
});

vi.mock("@webiny/app-headless-cms/admin/hooks/usePermission.js", () => {
    return {
        usePermission: () => {
            return { canPublish: () => permission.canPublish, canEdit: () => true };
        }
    };
});

const BLOCKED = { canSave: false, canPublish: false };

function renderBlocked(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({ ...params, children: <CmsEntryReviewBlockedActions /> });
}

function getDescription(button: HTMLElement): string | undefined {
    const describedBy = button.closest("[aria-describedby]")?.getAttribute("aria-describedby");
    return document.getElementById(describedBy ?? "")?.textContent ?? undefined;
}

describe("CmsEntryReviewBlockedActions", () => {
    beforeEach(() => {
        permission.canPublish = true;
    });

    it("is registered as the workflowBlockedActions action and not as a standalone tooltip", async () => {
        renderBlocked({ reviewVm: NO_WORKFLOW });

        const names = await screen.findByTestId("button-action-names");

        expect(names.textContent).toContain("workflowBlockedActions");
        expect(names.textContent).not.toContain("workflowStateTooltip");
    });

    it("shows focusable, aria-disabled Save and Publish with the reason while loading", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: LOADING });

        const publish = await screen.findByRole("button", { name: "Publish" });
        const save = screen.getByRole("button", { name: "Save" });

        expect(save.getAttribute("aria-disabled")).toBe("true");
        expect(publish.getAttribute("aria-disabled")).toBe("true");
        expect(publish.hasAttribute("disabled")).toBe(false);
        expect(getDescription(publish)).toBe(CHECKING);
        expect(getDescription(save)).toBe(CHECKING);
    });

    it("shows the failed reason", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: FAILED });

        const publish = await screen.findByRole("button", { name: "Publish" });

        expect(getDescription(publish)).toBe(FAILED_REASON);
        expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    });

    it("shows only Publish while a review is in progress", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: IN_REVIEW });

        const publish = await screen.findByRole("button", { name: "Publish" });

        expect(getDescription(publish)).toBe(IN_REVIEW_REASON);
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("shows only Publish for a rejected review", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: REJECTED });

        const publish = await screen.findByRole("button", { name: "Publish" });

        expect(getDescription(publish)).toBe(REJECTED_REASON);
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("shows Publish disabled, and no Save, when a workflow is bound but no review exists", async () => {
        renderBlocked({ formVm: { canSave: true, canPublish: false }, reviewVm: BOUND_NO_REVIEW });

        const publish = await screen.findByRole("button", { name: "Publish" });

        expect(getDescription(publish)).toBe(NEEDS_REVIEW);
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("never shows more than two buttons while the status is unknown", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: LOADING });

        await screen.findByRole("button", { name: "Publish" });

        expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it.each([
        [
            "publishing is allowed (the base Publish button is shown)",
            { canSave: false, canPublish: true },
            APPROVED,
            MODEL
        ],
        [
            "an unpublished revision may be published again (Q19)",
            { canSave: true, canPublish: true },
            BOUND_UNPUBLISHED,
            MODEL
        ],
        ["no workflow is bound", BLOCKED, NO_WORKFLOW, MODEL],
        ["the model is a singleton", BLOCKED, LOADING, SINGLETON_MODEL]
    ])("shows nothing when %s", async (_name, formVm, reviewVm, model) => {
        renderBlocked({ formVm: { ...formVm, model }, reviewVm });

        await screen.findByTestId("button-actions");
        await waitFor(() => expect(screen.queryByRole("button", { name: "Publish" })).toBeNull());
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("shows no Publish for a published entry, only the disabled Save", async () => {
        renderBlocked({
            formVm: { ...BLOCKED, entry: createEntry({ status: "published" }) },
            reviewVm: LOADING
        });

        expect(await screen.findByRole("button", { name: "Save" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
    });

    it("shows nothing for a new entry", async () => {
        renderBlocked({
            formVm: { ...BLOCKED, entry: null, isNewEntry: true },
            reviewVm: LOADING
        });

        await screen.findByTestId("button-actions");
        await waitFor(() => expect(screen.queryByRole("button", { name: "Publish" })).toBeNull());
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("shows no Publish without the publish permission, only the disabled Save", async () => {
        permission.canPublish = false;
        renderBlocked({ formVm: BLOCKED, reviewVm: LOADING });

        expect(await screen.findByRole("button", { name: "Save" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
    });
});
