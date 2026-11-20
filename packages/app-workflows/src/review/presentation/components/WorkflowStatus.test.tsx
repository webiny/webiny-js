import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { WorkflowStatus } from "./WorkflowStatus.js";

describe("WorkflowStatus", () => {
    it("renders the step tag, 100px wide with the step colour, then the state tag", () => {
        const { container } = renderWithAdminUi(
            <WorkflowStatus
                step={"Legal check"}
                stepColor={"#ff0000"}
                state={{ label: "Awaiting", variant: "warning-light", icon: "hourglass_empty" }}
                owner={"Luka Perić"}
            />
        );

        const step = screen.getByText("Legal check");
        const stepTag = step.closest("[data-role='workflow-status'] > span") as HTMLElement;
        expect(stepTag.className).toContain("w-[100px]");
        expect(stepTag.className).toContain("bg-neutral-light");
        expect(container.querySelector("[style*='background']")).not.toBeNull();

        const state = screen.getByText("Awaiting");
        expect(
            stepTag.compareDocumentPosition(state) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
    });

    it("names the step and its owner in the hover text", () => {
        renderWithAdminUi(
            <WorkflowStatus
                step={"Legal check"}
                stepColor={null}
                state={{ label: "In review", variant: "accent-light" }}
                owner={"Luka Perić"}
            />
        );

        expect(screen.getByTitle("Legal check · Luka Perić")).toBeTruthy();
    });

    it("has no hover text without an owner", () => {
        const { container } = renderWithAdminUi(
            <WorkflowStatus
                step={"Legal check"}
                stepColor={null}
                state={{ label: "Pending", variant: "neutral-base-outline" }}
                owner={null}
            />
        );

        const status = container.querySelector("[data-role='workflow-status']") as HTMLElement;
        expect(status.hasAttribute("title")).toBe(false);
    });

    it("renders only the state tag when there is no step", () => {
        const { container } = renderWithAdminUi(
            <WorkflowStatus
                step={null}
                stepColor={null}
                state={{ label: "Approved", variant: "success-light" }}
                owner={null}
            />
        );

        expect(screen.getByText("Approved")).toBeTruthy();
        expect(container.querySelector("[data-role='current-step-text']")).toBeNull();
    });

    it("renders a muted dash with neither a step nor a state", () => {
        const { container } = renderWithAdminUi(
            <WorkflowStatus step={null} stepColor={null} state={null} owner={"Luka Perić"} />
        );

        const dash = screen.getByText("-");
        expect(dash.className).toContain("text-neutral-strong");
        expect(container.querySelector("[data-role='workflow-status']")).toBeNull();
    });
});
