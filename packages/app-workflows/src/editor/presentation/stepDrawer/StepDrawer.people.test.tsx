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
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { PEOPLE_DRAWER_RENDERERS } from "~/editor/testing/peopleDrawerRenderers.js";
import type { PeopleDrawerRenderers } from "~/editor/testing/peopleDrawerRenderers.js";
import { StepDrawerPresenterFeature } from "./feature.js";
import { StepDrawer } from "./StepDrawer.js";

interface RenderersHolder {
    renderers: PeopleDrawerRenderers;
}

interface PickerStubProps {
    label: string;
    value: string | null;
    options: PickerOption[];
    error?: string | null;
    onChange(id: string | null): void;
}

const holder = vi.hoisted((): RenderersHolder => {
    return { renderers: {} };
});

/*
 * The real FormView with the real People renderers: the stub passes them as its `renderers` map
 * (read lazily, the map imports this module's own mock of app-admin). The picker is a stub that
 * lists its option labels, picks the first option on a click and shows its error message.
 */
vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const react = await import("react");
    const FormView = (props: React.ComponentProps<typeof actual.FormView>) => {
        return react.createElement(actual.FormView, { ...props, renderers: holder.renderers });
    };
    return { ...actual, FormView };
});

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowPicker: (props: PickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": `picker-${props.label}`,
                    "data-options": props.options.map(option => option.label).join("|")
                },
                react.createElement(
                    "button",
                    {
                        onClick: () => {
                            const first = props.options[0];
                            props.onChange(first ? first.id : null);
                        }
                    },
                    `pick first ${props.label}`
                ),
                props.error ? react.createElement("span", null, props.error) : null
            );
        }
    };
});

holder.renderers = PEOPLE_DRAWER_RENDERERS;

const RULE_ID = "r1";

const createPeopleStep = (target: RuleTargetValue = { type: "team", id: "team-1" }) => {
    return createReviewStep({
        config: {
            teams: ["team-1"],
            assignment: {
                strategy: "roundRobin",
                allowManualPick: false,
                rules: [
                    {
                        id: RULE_ID,
                        conditions: {
                            folder: { id: "f1", type: "cms:article", includeDescendants: false }
                        },
                        target
                    }
                ]
            }
        }
    });
};

const REFERENCES: RuleReferences = {
    users: new Map(),
    teams: new Map([["team-1", { id: "team-1", label: "Editors", state: "found" }]]),
    folders: new Map([["f1", { id: "f1", label: "Deleted folder", state: "deleted" }]]),
    userTeamIds: new Map()
};

const INSPECTION: RoutingInspection = {
    owner: { id: "user-1", displayName: "Ivan Horvat" },
    source: "rule",
    ruleId: RULE_ID,
    strategy: "roundRobin",
    narrowedTeamId: null,
    candidateIds: [],
    candidateCount: 0,
    trace: [{ ruleId: RULE_ID, outcome: "matched", reason: null, failedConditions: [] }],
    skipped: []
};

const IVAN: WorkflowUserSummary = { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"] };
const PARTNERS: AppFolder = { id: "f2", path: "/Partners" };

const createSetup = () => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const presenter = StepDrawerPresenterFeature.resolve(container).presenter;
    const source = new FakeStepDrawerSource([createPeopleStep()]);
    source.errors = [
        {
            field: "config.assignment.rules.target",
            message: "The target team is not one of the step's reviewing teams.",
            ruleId: RULE_ID
        }
    ];
    source.setReferences(REFERENCES);
    source.setUsers({ items: [IVAN], selected: [], loading: false, failed: false });
    source.setMembers({ items: [IVAN], selected: [], loading: false, failed: false });
    source.setFolders({ items: [PARTNERS], loading: false, failed: false });
    source.folderType = "cms:article";
    source.modelId = "article";
    source.inspectRouting.mockResolvedValue(INSPECTION);

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
    return { presenter, source, open };
};

const activateTab = (name: RegExp) => {
    act(() => {
        fireEvent.mouseDown(screen.getByRole("tab", { name }));
    });
};

describe("StepDrawer with the real People form (R234, R293, R300)", () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("shows the General, Assignment and Test routing tabs", () => {
        const { open } = createSetup();

        act(() => {
            open("step-1");
        });

        expect(screen.getByRole("tab", { name: /General/ })).toBeTruthy();
        expect(screen.getByRole("tab", { name: /Assignment/ })).toBeTruthy();
        expect(screen.getByRole("tab", { name: /Test routing/ })).toBeTruthy();
    });

    it("shows a rule warning and a rule error on the Assignment tab", () => {
        const { open } = createSetup();
        act(() => {
            open("step-1");
        });

        activateTab(/Assignment/);

        expect(screen.getByText("Rule 1")).toBeTruthy();
        expect(screen.getByText("The folder no longer exists.")).toBeTruthy();
        expect(
            screen.getByText("The target team is not one of the step's reviewing teams.")
        ).toBeTruthy();
    });

    it("keeps a rule's target error when its folder is edited and clears it when the target is", () => {
        const { open, source } = createSetup();
        // The rule targets a user, so picking the first target option (the team) edits the target.
        source.setSteps([createPeopleStep({ type: "user", id: "user-1" })]);
        act(() => {
            open("step-1");
        });
        activateTab(/Assignment/);
        const message = "The target team is not one of the step's reviewing teams.";

        act(() => {
            fireEvent.click(
                screen.getByRole("button", { name: "pick first Content is in folder" })
            );
        });

        expect(screen.getByText(message)).toBeTruthy();

        act(() => {
            fireEvent.click(screen.getByRole("button", { name: "pick first Then assign to" }));
        });

        expect(screen.queryByText(message)).toBeNull();
    });

    it("lists the users in the Requester picker of the Test routing tab", () => {
        const { open } = createSetup();
        act(() => {
            open("step-1");
        });

        activateTab(/Test routing/);

        const requester = screen.getByTestId("picker-Requester");
        expect(requester.getAttribute("data-options")).toBe("Ivan Horvat");
        const folder = screen.getByTestId("picker-Folder");
        expect(folder.getAttribute("data-options")).toBe("/Partners");
    });

    it("runs a test from the Test routing tab and shows the server's answer", async () => {
        const { open, source } = createSetup();
        act(() => {
            open("step-1");
        });
        activateTab(/Test routing/);

        const button = screen.getByRole("button", { name: "Test routing" }) as HTMLButtonElement;
        expect(button.disabled).toBe(false);
        fireEvent.click(button);
        expect(source.inspectRouting).not.toHaveBeenCalled();

        act(() => {
            fireEvent.click(screen.getByRole("button", { name: "pick first Requester" }));
        });
        await waitFor(() => {
            const enabled = screen.getByRole("button", {
                name: "Test routing"
            }) as HTMLButtonElement;
            expect(enabled.disabled).toBe(false);
        });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Test routing" }));
        });

        expect(source.inspectRouting).toHaveBeenCalledTimes(1);
        const params = source.inspectRouting.mock.calls[0][0];
        expect(params.requesterId).toBe("user-1");
        expect(params.folderId).toBeNull();
        expect(await screen.findByText("Assigned by rule 1")).toBeTruthy();
        expect(screen.getByText("Ivan Horvat")).toBeTruthy();
        expect(screen.getByText("Matched")).toBeTruthy();
    });
});
