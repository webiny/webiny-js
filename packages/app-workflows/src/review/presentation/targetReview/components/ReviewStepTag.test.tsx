import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { ReviewStepTag } from "./ReviewStepTag.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";

describe("ReviewStepTag", () => {
    it("renders the label of a plain tag without an icon", () => {
        renderWithAdminUi(
            <ReviewStepTag tag={{ label: "Failed", variant: "destructive" }} tooltip={null} />
        );

        const label = screen.getByText("Failed");
        expect(label.parentElement?.querySelector("[data-testid='svg-icon']")).toBeNull();
    });

    it("renders the progress_activity icon of a running tag", () => {
        renderWithAdminUi(
            <ReviewStepTag
                tag={{ label: "Running", variant: "accent-light", icon: "progress_activity" }}
                tooltip={null}
            />
        );

        const label = screen.getByText("Running");
        expect(label.parentElement?.querySelector("[data-testid='svg-icon']")).not.toBeNull();
    });

    it("shows the tooltip text when the tag receives focus (R264)", async () => {
        renderWithAdminUi(
            <ReviewStepTag
                tag={{ label: "Running", variant: "accent-light", icon: "progress_activity" }}
                tooltip={"AI tone check is running since 14:20."}
            />
        );
        const trigger = screen.getByText("Running").closest(".inline-block");

        fireEvent.focus(trigger as HTMLElement);

        const matches = await screen.findAllByText("AI tone check is running since 14:20.");
        expect(matches.length).toBeGreaterThan(0);
    });

    it("renders no tooltip trigger without a tooltip", () => {
        renderWithAdminUi(
            <ReviewStepTag tag={{ label: "Approved", variant: "success-light" }} tooltip={null} />
        );

        expect(screen.getByText("Approved").closest(".inline-block")).toBeNull();
    });
});
