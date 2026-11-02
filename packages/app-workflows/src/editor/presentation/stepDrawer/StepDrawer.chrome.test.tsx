import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { PEOPLE_DRAWER_RENDERERS } from "~/editor/testing/peopleDrawerRenderers.js";
import type { PeopleDrawerRenderers } from "~/editor/testing/peopleDrawerRenderers.js";
import { StepDrawerPresenterFeature } from "./feature.js";
import { StepDrawer } from "./StepDrawer.js";

interface RenderersHolder {
    renderers: PeopleDrawerRenderers;
}

const holder = vi.hoisted((): RenderersHolder => {
    return { renderers: {} };
});

/*
 * The real FormView with the real People renderers (the map of Task 22b), passed lazily because
 * the map imports app-admin, which this file mocks.
 */
vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const react = await import("react");
    const FormView = (props: React.ComponentProps<typeof actual.FormView>) => {
        return react.createElement(actual.FormView, { ...props, renderers: holder.renderers });
    };
    return { ...actual, FormView };
});

holder.renderers = PEOPLE_DRAWER_RENDERERS;

const RULE_ERROR: StepFieldError = {
    field: "config.assignment.rules.target",
    message: "The target team is not one of the step's reviewing teams.",
    ruleId: "r1"
};

const TITLE_ERROR: StepFieldError = {
    field: "title",
    message: "Enter a title for this step.",
    ruleId: null
};

const LEGAL_LINE: StepWarningLine = { text: "Legal has no members.", severity: "warning" };

const WEBHOOK_LINE: StepWarningLine = {
    text: "The automation “Send webhook” no longer exists.",
    severity: "warning"
};

const createPeopleStep = (): EditorStep => {
    return createReviewStep({
        config: {
            teams: ["team-1"],
            assignment: {
                strategy: "none",
                allowManualPick: false,
                rules: [{ id: "r1", conditions: {}, target: { type: "team", id: "team-1" } }]
            }
        }
    });
};

const createSetup = (step: EditorStep, configure?: (source: FakeStepDrawerSource) => void) => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const source = new FakeStepDrawerSource([step]);
    if (configure) {
        configure(source);
    }
    const wrap = (stepId: string | null) => {
        return (
            <AdminUiProvider>
                <DiContainerProvider container={container}>
                    <StepDrawer source={source} stepId={stepId} />
                </DiContainerProvider>
            </AdminUiProvider>
        );
    };
    const view = render(wrap(null));
    const open = (stepId: string | null) => {
        view.rerender(wrap(stepId));
    };
    return { source, open };
};

const tabOf = (name: RegExp): HTMLElement => {
    return screen.getByRole("tab", { name });
};

const activateTab = (name: RegExp) => {
    act(() => {
        fireEvent.mouseDown(tabOf(name));
    });
};

const isSelected = (name: RegExp): boolean => {
    return tabOf(name).getAttribute("aria-selected") === "true";
};

describe("StepDrawer chrome (R302, R309, R312)", () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("shows the three tabs of a People step, with General open", () => {
        const { open } = createSetup(createPeopleStep());

        act(() => {
            open("step-1");
        });

        expect(screen.getAllByRole("tab")).toHaveLength(3);
        expect(isSelected(/General/)).toBe(true);
        expect(isSelected(/Assignment/)).toBe(false);
        expect(isSelected(/Test routing/)).toBe(false);
    });

    it("shows no tabs for an Automation step", () => {
        const { open } = createSetup(createAutomationStep({ id: "step-1" }));

        act(() => {
            open("step-1");
        });

        expect(screen.queryAllByRole("tab")).toHaveLength(0);
    });

    it("pads the body top when the form has no tabs and not when it has tabs", () => {
        const automation = createSetup(createAutomationStep({ id: "step-1" }));
        act(() => {
            automation.open("step-1");
        });
        expect(screen.getByTestId("step-drawer-body").classList.contains("pt-md")).toBe(true);

        cleanup();
        const people = createSetup(createPeopleStep());
        act(() => {
            people.open("step-1");
        });
        expect(screen.getByTestId("step-drawer-body").classList.contains("pt-md")).toBe(false);
    });

    it("opens on the Assignment tab for a rule error, with no banner", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.errors = [RULE_ERROR];
        });

        act(() => {
            open("step-1");
        });

        expect(isSelected(/Assignment/)).toBe(true);
        expect(screen.queryByText(/This step has an error/)).toBeNull();
    });

    it("shows the banner on another tab and Show brings the error tab back", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.errors = [RULE_ERROR];
        });
        act(() => {
            open("step-1");
        });

        activateTab(/General/);

        expect(screen.getByText("This step has an error on the Assignment tab.")).toBeTruthy();
        expect(isSelected(/General/)).toBe(true);

        act(() => {
            fireEvent.click(screen.getByRole("button", { name: "Show" }));
        });

        expect(isSelected(/Assignment/)).toBe(true);
        expect(screen.queryByText(/This step has an error/)).toBeNull();
    });

    it("opens on General for a General error and names it when another tab is open", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.errors = [TITLE_ERROR];
        });
        act(() => {
            open("step-1");
        });
        expect(isSelected(/General/)).toBe(true);
        expect(screen.queryByText(/This step has an error/)).toBeNull();

        activateTab(/Assignment/);

        expect(screen.getByText("This step has an error on the General tab.")).toBeTruthy();
    });

    it("shows the banner on the Test routing tab too", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.errors = [RULE_ERROR];
        });
        act(() => {
            open("step-1");
        });

        activateTab(/Test routing/);

        expect(screen.getByText("This step has an error on the Assignment tab.")).toBeTruthy();
    });

    it("shows the Check this step block on General and Assignment and hides it on Test routing", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.setWarnings([LEGAL_LINE]);
        });
        act(() => {
            open("step-1");
        });

        expect(screen.getByText("Check this step")).toBeTruthy();
        expect(screen.getByText("Legal has no members.")).toBeTruthy();

        activateTab(/Test routing/);
        expect(screen.queryByText("Check this step")).toBeNull();

        activateTab(/Assignment/);
        expect(screen.getByText("Check this step")).toBeTruthy();
    });

    it("shows no block for a step without warnings", () => {
        const { open } = createSetup(createPeopleStep());

        act(() => {
            open("step-1");
        });

        expect(screen.queryByText("Check this step")).toBeNull();
    });

    it("shows the block for a step without tabs", () => {
        const { open } = createSetup(createAutomationStep({ id: "step-1" }), source => {
            source.setWarnings([WEBHOOK_LINE]);
        });

        act(() => {
            open("step-1");
        });

        expect(screen.getByText("Check this step")).toBeTruthy();
        expect(screen.getByText("The automation “Send webhook” no longer exists.")).toBeTruthy();
    });

    it("shows the teams-off notice and no tabs for a read-only People step", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.readOnly = true;
        });

        act(() => {
            open("step-1");
        });

        expect(
            screen.getByText("This step needs teams, which are not enabled. It can't be edited.")
        ).toBeTruthy();
        expect(screen.queryAllByRole("tab")).toHaveLength(0);
    });

    it("keeps the 560px drawer and Done applying and closing", async () => {
        const { open, source } = createSetup(createPeopleStep());
        act(() => {
            open("step-1");
        });

        expect(screen.getByRole("dialog").style.width).toBe("560px");
        // Unticks the `e-mail` transport the step notifies through.
        act(() => {
            fireEvent.click(screen.getByRole("checkbox", { name: /E-mail/ }));
        });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Done" }));
        });

        expect(source.updateStep).toHaveBeenCalledTimes(1);
        expect(source.updateStep.mock.calls[0][1]).toMatchObject({ notificationIds: [] });
        expect(source.closeStep).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("dialog")).toBeNull();
    });
});
