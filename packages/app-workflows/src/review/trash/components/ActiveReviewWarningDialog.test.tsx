import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DialogParamsContext } from "@webiny/app-admin/components/Dialogs/DialogParamsContext.js";
import type { BlockingReview } from "~/review/domain/types.js";
import { ActiveReviewTrashFeature } from "../feature.js";
import { ActiveReviewWarningDialog } from "./ActiveReviewWarningDialog.js";

// Radix needs these in jsdom.
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const reviews: BlockingReview[] = [
    {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal"
    },
    {
        reviewId: "review-2",
        model: "cms.article",
        targetId: "entry-2",
        targetRevisionId: "entry-2#0001",
        title: "Spring campaign",
        stepPosition: 1,
        stepCount: 1,
        stepName: "Editor"
    }
];

interface RenderOptions {
    action?: "trash" | "delete";
    onConfirm?: () => Promise<void>;
}

function renderDialog(options: RenderOptions = {}) {
    const container = new Container();
    ActiveReviewTrashFeature.register(container);
    const onConfirm = vi.fn(options.onConfirm ?? (async () => undefined));
    const onCancel = vi.fn();
    const closeDialog = vi.fn();

    render(
        <AdminUiProvider>
            <DiContainerProvider container={container}>
                <DialogParamsContext.Provider
                    value={{
                        params: {
                            reviews,
                            action: options.action ?? "trash",
                            onConfirm,
                            onCancel
                        },
                        closeDialog
                    }}
                >
                    <ActiveReviewWarningDialog />
                </DialogParamsContext.Provider>
            </DiContainerProvider>
        </AdminUiProvider>
    );

    return { onConfirm, onCancel, closeDialog };
}

describe("ActiveReviewWarningDialog", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the trash texts and one line per review", async () => {
        renderDialog({ action: "trash" });

        expect(await screen.findByText("Review in progress")).toBeTruthy();
        expect(
            screen.getByText(
                "This content has a review in progress. Trashing it cancels the review."
            )
        ).toBeTruthy();
        expect(screen.getByText("Launch article · Step 2 of 3 (Legal)")).toBeTruthy();
        expect(screen.getByText("Spring campaign · Step 1 of 1 (Editor)")).toBeTruthy();
    });

    it("shows the delete body for the delete action", async () => {
        renderDialog({ action: "delete" });

        expect(
            await screen.findByText(
                "This content has a review in progress. Deleting it cancels the review."
            )
        ).toBeTruthy();
    });

    it("Confirm calls the dialog's confirm once and then closes the dialog", async () => {
        const { onConfirm, onCancel, closeDialog } = renderDialog();

        fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

        await waitFor(() => expect(closeDialog).toHaveBeenCalledTimes(1));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("Cancel dismisses and closes without confirming", async () => {
        const { onConfirm, onCancel, closeDialog } = renderDialog();

        fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(closeDialog).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("shows the busy label and ignores Cancel while confirming", async () => {
        let release: () => void = () => undefined;
        const { onCancel, closeDialog } = renderDialog({
            onConfirm: () =>
                new Promise<void>(resolve => {
                    release = resolve;
                })
        });

        fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

        expect(await screen.findByText("Processing...")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).not.toHaveBeenCalled();

        release();
        await waitFor(() => expect(closeDialog).toHaveBeenCalledTimes(1));
    });

    it("keeps the dialog open with an error when the confirm throws, and Confirm can be retried", async () => {
        const failures = [new Error("boom")];
        const { onConfirm, closeDialog } = renderDialog({
            onConfirm: async () => {
                const failure = failures.shift();
                if (failure) {
                    throw failure;
                }
            }
        });

        fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

        expect(
            await screen.findByText(
                "The server did not respond, so nothing was changed. Try again."
            )
        ).toBeTruthy();
        expect(closeDialog).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

        await waitFor(() => expect(closeDialog).toHaveBeenCalledTimes(1));
        expect(onConfirm).toHaveBeenCalledTimes(2);
    });
});
