import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { ReviewStepsPopover } from "./ReviewStepsPopover.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createTargetReviewViewModel } from "~/review/testing/createTargetReviewViewModel.js";
import type { TargetReviewProgressVm } from "../abstractions.js";

const progress = (): TargetReviewProgressVm => {
    const vm = createTargetReviewViewModel();
    return vm.progress as TargetReviewProgressVm;
};

describe("ReviewStepsPopover", () => {
    it("hands Radix a ref-able wrapper as the trigger, with the button inside it", () => {
        renderWithAdminUi(<ReviewStepsPopover progress={progress()} />);

        const button = screen.getByRole("button", { name: /steps approved/ });
        const wrapper = button.closest("[data-role='review-steps-trigger']");

        expect(wrapper).not.toBeNull();
        expect(wrapper).not.toBe(button);
        expect(wrapper?.hasAttribute("data-state")).toBe(true);
    });

    it("wraps the progress bar and the count button in the trigger wrapper", () => {
        renderWithAdminUi(
            <ReviewStepsPopover progress={progress()} bar={<div data-role={"test-bar"} />} />
        );

        const wrapper = document.querySelector("[data-role='review-steps-trigger']");
        expect(wrapper?.querySelector("[data-role='test-bar']")).not.toBeNull();
        expect(wrapper?.querySelector("button")).not.toBeNull();
    });

    it("opens on a click of the inner button and not on hover", () => {
        renderWithAdminUi(<ReviewStepsPopover progress={progress()} />);

        const button = screen.getByRole("button", { name: /steps approved/ });
        fireEvent.mouseEnter(button);
        fireEvent.mouseOver(button);
        expect(document.querySelector("[data-role='review-steps-content']")).toBeNull();

        fireEvent.click(button);
        expect(document.querySelector("[data-role='review-steps-content']")).not.toBeNull();
    });

    it("returns the focus to the button when Escape closes the popover", async () => {
        const user = userEvent.setup();
        renderWithAdminUi(<ReviewStepsPopover progress={progress()} />);

        const button = screen.getByRole("button", { name: /steps approved/ });
        await user.click(button);
        expect(document.querySelector("[data-role='review-steps-content']")).not.toBeNull();

        await user.keyboard("{Escape}");
        await waitFor(() => {
            expect(document.querySelector("[data-role='review-steps-content']")).toBeNull();
            expect(document.activeElement).toBe(button);
        });
    });

    it("leaves the focus on another control the user clicks to close the popover", async () => {
        const user = userEvent.setup();
        renderWithAdminUi(
            <>
                <ReviewStepsPopover progress={progress()} />
                <button type={"button"}>Comments</button>
            </>
        );

        const button = screen.getByRole("button", { name: /steps approved/ });
        const other = screen.getByRole("button", { name: "Comments" });
        await user.click(button);
        expect(document.querySelector("[data-role='review-steps-content']")).not.toBeNull();

        await user.click(other);
        await waitFor(() => {
            expect(document.querySelector("[data-role='review-steps-content']")).toBeNull();
        });
        expect(document.activeElement).toBe(other);
    });
});
