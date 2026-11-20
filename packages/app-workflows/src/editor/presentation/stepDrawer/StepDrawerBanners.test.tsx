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
import { StepDrawerBanners } from "./StepDrawerBanners.js";
import type { StepDrawerBannersProps } from "./StepDrawerBanners.js";

const createProps = (overrides: Partial<StepDrawerBannersProps> = {}): StepDrawerBannersProps => {
    return {
        licenceAlert: null,
        notice: null,
        topError: null,
        errorTab: null,
        activeTabId: "general",
        onShowErrorTab: vi.fn(),
        ...overrides
    };
};

describe("StepDrawerBanners (R302, R309, R312)", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders nothing for a step with nothing to say", () => {
        const { container } = renderWithAdminUi(<StepDrawerBanners {...createProps()} />);

        expect(container.querySelector("[role='alert']")).toBeNull();
    });

    it("shows the banner with Show when the error is on another tab", () => {
        const props = createProps({ errorTab: "assignment", activeTabId: "general" });
        renderWithAdminUi(<StepDrawerBanners {...props} />);

        expect(screen.getByText("This step has an error on the Assignment tab.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Show" }));

        expect(props.onShowErrorTab).toHaveBeenCalledTimes(1);
    });

    it("names the General tab for an error there", () => {
        renderWithAdminUi(
            <StepDrawerBanners
                {...createProps({ errorTab: "general", activeTabId: "assignment" })}
            />
        );

        expect(screen.getByText("This step has an error on the General tab.")).toBeTruthy();
    });

    it("shows the banner on the Test routing tab, which never holds an error", () => {
        renderWithAdminUi(
            <StepDrawerBanners
                {...createProps({ errorTab: "assignment", activeTabId: "testRouting" })}
            />
        );

        expect(screen.getByText("This step has an error on the Assignment tab.")).toBeTruthy();
    });

    it("shows no banner when the error is on the open tab", () => {
        renderWithAdminUi(
            <StepDrawerBanners
                {...createProps({ errorTab: "assignment", activeTabId: "assignment" })}
            />
        );

        expect(screen.queryByText(/This step has an error/)).toBeNull();
        expect(screen.queryByRole("button", { name: "Show" })).toBeNull();
    });

    it("shows no banner when the form has no tabs", () => {
        renderWithAdminUi(
            <StepDrawerBanners {...createProps({ errorTab: "general", activeTabId: null })} />
        );

        expect(screen.queryByText(/This step has an error/)).toBeNull();
    });

    it("shows no banner without an error", () => {
        renderWithAdminUi(<StepDrawerBanners {...createProps()} />);

        expect(screen.queryByText(/This step has an error/)).toBeNull();
    });

    it("has no Check this step block (B23)", () => {
        renderWithAdminUi(<StepDrawerBanners {...createProps({ activeTabId: null })} />);

        expect(screen.queryByText("Check this step")).toBeNull();
        expect(screen.queryByRole("listitem")).toBeNull();
    });

    it("shows the notice, the top error and the licence alert", () => {
        const props = createProps({
            notice: "This step needs teams, which are not enabled. It can't be edited.",
            topError: "Could not save. Check the highlighted step.",
            licenceAlert: { title: "AI Power-Ups licence missing", text: "This step is read-only." }
        });
        renderWithAdminUi(<StepDrawerBanners {...props} />);

        expect(
            screen.getByText("This step needs teams, which are not enabled. It can't be edited.")
        ).toBeTruthy();
        expect(screen.getByText("Could not save. Check the highlighted step.")).toBeTruthy();
        expect(screen.getByText("AI Power-Ups licence missing")).toBeTruthy();
    });
});
