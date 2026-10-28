import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
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

    it("opens on a click of the inner button and not on hover", () => {
        renderWithAdminUi(<ReviewStepsPopover progress={progress()} />);

        const button = screen.getByRole("button", { name: /steps approved/ });
        fireEvent.mouseEnter(button);
        fireEvent.mouseOver(button);
        expect(document.querySelector("[data-role='review-steps-content']")).toBeNull();

        fireEvent.click(button);
        expect(document.querySelector("[data-role='review-steps-content']")).not.toBeNull();
    });
});
