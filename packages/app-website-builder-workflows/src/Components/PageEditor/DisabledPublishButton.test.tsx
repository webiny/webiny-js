import React from "react";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { DisabledPublishButton } from "./DisabledPublishButton.js";

vi.mock("@webiny/icons/publish.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock(
    "@webiny/app-workflows/review/presentation/targetReview/components/ReviewTooltip.js",
    async () => {
        const React = await import("react");
        interface StubProps {
            presenter: { vm: { publishDisabledReason: string | null } };
            children: (describedBy: string) => React.ReactNode;
        }
        const ReviewTooltip = (props: StubProps) => {
            const reason = props.presenter.vm.publishDisabledReason ?? "";
            return React.createElement(
                "span",
                { "data-testid": "review-tooltip", "data-reason": reason },
                props.children("tooltip-description")
            );
        };
        return { ReviewTooltip };
    }
);

describe("DisabledPublishButton", () => {
    afterEach(() => {
        cleanup();
    });

    it("stays focusable: aria-disabled, never the disabled attribute", () => {
        const { presenter } = createFakeSession("none");

        render(<DisabledPublishButton presenter={presenter} />);

        const button = screen.getByRole("button", { name: "Publish" });
        expect(button.getAttribute("aria-disabled")).toBe("true");
        expect(button.hasAttribute("disabled")).toBe(false);
        expect(button.getAttribute("aria-describedby")).toBe("tooltip-description");
    });

    it("is wrapped in the shared review tooltip of the same presenter", () => {
        const { presenter } = createFakeSession("none");

        render(<DisabledPublishButton presenter={presenter} />);

        const button = screen.getByRole("button", { name: "Publish" });
        const tooltip = button.closest("[data-testid='review-tooltip']");
        const reason = presenter.vm.publishDisabledReason;
        expect(reason).not.toBeNull();
        expect(tooltip?.getAttribute("data-reason")).toBe(reason);
    });

    it("does nothing when activated, not even a form submit", () => {
        const { presenter } = createFakeSession("none");
        const onSubmit = vi.fn();

        render(
            <form onSubmit={onSubmit}>
                <DisabledPublishButton presenter={presenter} />
            </form>
        );
        const button = screen.getByRole("button", { name: "Publish" });
        fireEvent.click(button);

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
