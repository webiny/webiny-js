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
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { findFormFieldVm } from "~/editor/testing/findFormFieldVm.js";
import { StepDrawerPresenterFeature } from "./feature.js";
import { StepDrawer } from "./StepDrawer.js";

interface FormViewStubFieldVm {
    name: string;
}

interface FormViewStubTabVm {
    layout: FormViewStubNodeVm[];
}

interface FormViewStubNodeVm {
    type: string;
    fields?: FormViewStubFieldVm[];
    tabs?: FormViewStubTabVm[];
}

interface FormViewStubProps {
    form: { layout: FormViewStubNodeVm[] };
}

// The real FormView needs the admin config to find renderers; the stub lists the fields it was given
// and proves the options context reaches the form.
vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const react = await import("react");
    const { useStepFormOptions } =
        await import("~/editor/presentation/stepForm/useStepFormOptions.js");
    const collectNames = (nodes: FormViewStubNodeVm[], names: string[]): void => {
        for (const node of nodes) {
            for (const field of node.fields ?? []) {
                names.push(field.name);
            }
            for (const tab of node.tabs ?? []) {
                collectNames(tab.layout, names);
            }
        }
    };
    const FormView = (props: FormViewStubProps) => {
        const options = useStepFormOptions();
        const names: string[] = [];
        collectNames(props.form.layout, names);
        return react.createElement("div", {
            "data-testid": "form-view",
            "data-fields": names.join(","),
            "data-transports": String(options.transports.options.length)
        });
    };
    return { ...actual, FormView };
});

const createSetup = (step: EditorStep, configure?: (source: FakeStepDrawerSource) => void) => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const presenter = StepDrawerPresenterFeature.resolve(container).presenter;
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
    return { presenter, source, open, container };
};

const automationStep = () => {
    return createAutomationStep({
        id: "step-1",
        config: { automationId: "send-webhook", settings: { url: "https://x.test" } }
    });
};

describe("StepDrawer (README 4, R284)", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders nothing while stepId is null", () => {
        createSetup(createReviewStep());

        expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
    });

    it("opens for the stepId, with the sub line above the title, the footer text and Done", () => {
        const { open } = createSetup(createReviewStep());

        act(() => {
            open("step-1");
        });

        expect(screen.getByText("Legal sign-off")).toBeDefined();
        expect(screen.getByText("People step · the type can't be changed")).toBeDefined();
        expect(screen.getByText("Edits stay in this workflow until you save it.")).toBeDefined();
        expect(screen.getByRole("button", { name: "Done" })).toBeDefined();
    });

    it("closes without telling the editor when stepId turns null", () => {
        const { open, source } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });

        act(() => {
            open(null);
        });

        expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
        expect(source.closeStep).not.toHaveBeenCalled();
    });

    it("renders the form and provides the options context to it", () => {
        const { open } = createSetup(createReviewStep());

        act(() => {
            open("step-1");
        });

        const form = screen.getByTestId("form-view");
        expect(form.getAttribute("data-fields")).toBe(
            "title,color,description,teams,notifications,assignment"
        );
        expect(form.getAttribute("data-transports")).toBe("1");
    });

    it("applies the edits and calls closeStep on Done", async () => {
        const { open, presenter, source } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });
        act(() => {
            findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");
        });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Done" }));
        });

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ title: "Legal review" })
        );
        expect(source.closeStep).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
    });

    it("Escape applies the edits like Done and calls closeStep", async () => {
        const { open, presenter, source } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });
        act(() => {
            findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");
        });

        await act(async () => {
            fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        });

        expect(source.updateStep).toHaveBeenCalledTimes(1);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("reopens the same step after the editor cleared and set the id again", () => {
        const { open } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });
        act(() => {
            open(null);
        });

        act(() => {
            open("step-1");
        });

        expect(screen.getByRole("button", { name: "Done" })).toBeDefined();
    });

    it("shows an error with no form field at the top of the drawer", () => {
        const { open } = createSetup(createReviewStep(), configured => {
            configured.errors = [
                {
                    field: "config.assignment",
                    message: "Rule 1: the user was deleted.",
                    ruleId: null
                }
            ];
        });

        act(() => {
            open("step-1");
        });

        expect(screen.getByText("Rule 1: the user was deleted.")).toBeDefined();
    });

    it("shows the licence alert for an AI step without the licence (QBZ-47)", () => {
        const { open } = createSetup(createAiStep({ id: "step-1" }), configured => {
            configured.readOnly = true;
        });

        act(() => {
            open("step-1");
        });

        expect(screen.getByText("AI Power-Ups licence missing")).toBeDefined();
        expect(
            screen.getByText(
                "This step is read-only. Reviews that reach it fail; they can be restarted once the licence is back.",
                { exact: false }
            )
        ).toBeDefined();
    });

    it("asks before switching an automation that has settings, and switches on confirm (QBZ-14)", async () => {
        const { open, presenter } = createSetup(automationStep());
        act(() => {
            open("step-1");
        });
        expect(screen.getByTestId("form-view").getAttribute("data-fields")).toContain("settings");

        act(() => {
            presenter.formOptions.automations.select("post-to-slack");
        });

        expect(screen.getByText("Switch to “Post to Slack”?")).toBeDefined();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Switch automation" }));
        });

        expect(screen.queryByText("Switch to “Post to Slack”?")).toBeNull();
        expect(screen.getByTestId("form-view").getAttribute("data-fields")).not.toContain(
            "settings"
        );
    });

    it("keeps the automation when the switch is cancelled", async () => {
        const { open, presenter } = createSetup(automationStep());
        act(() => {
            open("step-1");
        });
        act(() => {
            presenter.formOptions.automations.select("post-to-slack");
        });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        });

        expect(screen.queryByText("Switch to “Post to Slack”?")).toBeNull();
        expect(presenter.vm.form?.getData().automationId).toBe("send-webhook");
    });

    it("resets the presenter when the drawer unmounts", () => {
        const { open, presenter } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });

        cleanup();

        expect(presenter.vm.open).toBe(false);
    });
});
