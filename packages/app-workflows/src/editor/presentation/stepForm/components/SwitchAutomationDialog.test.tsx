import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { SwitchAutomationDialog } from "./SwitchAutomationDialog.js";

const confirmation = {
    title: "Switch to “Post to Slack”?",
    body: "The settings for Send webhook are cleared. The change applies when you save the workflow.",
    cancelLabel: "Cancel",
    confirmLabel: "Switch automation"
};

describe("SwitchAutomationDialog (QBZ-14)", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the title, the body and the two buttons", () => {
        renderWithAdminUi(
            <SwitchAutomationDialog
                confirmation={confirmation}
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.getByText("Switch to “Post to Slack”?")).toBeDefined();
        expect(
            screen.getByText(
                "The settings for Send webhook are cleared. The change applies when you save the workflow."
            )
        ).toBeDefined();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
        expect(screen.getByRole("button", { name: "Switch automation" })).toBeDefined();
    });

    it("confirms with Switch automation", () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        renderWithAdminUi(
            <SwitchAutomationDialog
                confirmation={confirmation}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Switch automation" }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("cancels with Cancel", () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        renderWithAdminUi(
            <SwitchAutomationDialog
                confirmation={confirmation}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
