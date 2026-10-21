import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { ReviewTooltip } from "./ReviewTooltip.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createFakePresenter } from "~/review/testing/targetReviewFakes.js";
import { createViewModel } from "~/review/testing/targetReviewFakes.js";

const REASON = "The review status could not be loaded. Try again from the review bar.";

describe("ReviewTooltip", () => {
    it("renders only the control, without a description, when nothing is disabled", () => {
        const presenter = createFakePresenter(createViewModel({ publishDisabledReason: null }));

        renderWithAdminUi(
            <ReviewTooltip presenter={presenter}>
                {describedBy => (
                    <button type="button" aria-describedby={describedBy}>
                        Publish
                    </button>
                )}
            </ReviewTooltip>
        );

        expect(screen.getByText("Publish").getAttribute("aria-describedby")).toBeNull();
    });

    it("puts aria-describedby on the control itself, pointing at the hidden reason (QBZ-36)", () => {
        const presenter = createFakePresenter(createViewModel({ publishDisabledReason: REASON }));

        renderWithAdminUi(
            <ReviewTooltip presenter={presenter}>
                {describedBy => (
                    <button type="button" aria-disabled="true" aria-describedby={describedBy}>
                        Publish
                    </button>
                )}
            </ReviewTooltip>
        );

        const button = screen.getByText("Publish");
        const description = document.getElementById(button.getAttribute("aria-describedby") ?? "");
        expect(description?.textContent).toBe(REASON);
        expect(description?.className).toContain("sr-only");
    });

    it("shows the reason when the control receives focus", async () => {
        const presenter = createFakePresenter(createViewModel({ publishDisabledReason: REASON }));

        renderWithAdminUi(
            <ReviewTooltip presenter={presenter}>
                {describedBy => (
                    <button type="button" aria-disabled="true" aria-describedby={describedBy}>
                        Publish
                    </button>
                )}
            </ReviewTooltip>
        );
        fireEvent.focus(screen.getByText("Publish"));

        const matches = await screen.findAllByText(REASON);
        expect(matches.length).toBeGreaterThan(1);
    });
});
