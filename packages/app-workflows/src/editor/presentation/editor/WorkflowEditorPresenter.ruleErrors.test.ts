import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";

const failure = (data: unknown, message: string): GraphQLOperationError => {
    return new GraphQLOperationError({ code: WorkflowErrorCode.Validation, data, message });
};

const dirtySetup = async () => {
    const setup = createEditorPresenterSetup();
    setup.useCases.getWorkflow.mockResolvedValue(
        createEditorWorkflow({
            steps: [
                createRoutingStep([
                    createStoredRule({ id: "r-1", target: { type: "user", id: "user-1" } }),
                    createStoredRule({ id: "r-2", target: { type: "user", id: "user-2" } })
                ])
            ]
        })
    );
    setup.app.listFolders.mockResolvedValue([]);
    setup.useCases.folderExists.mockResolvedValue(true);
    // Both targets resolve and belong to the step's team, so client validation lets the save through.
    setup.listWorkflowUsers.execute.mockResolvedValue({
        users: [
            createListedUser("user-1", "Ada Lovelace"),
            createListedUser("user-2", "Grace Hopper")
        ],
        missingIds: []
    });
    await setup.presenter.init(setup.params);
    setup.presenter.setName("Changed");
    return setup;
};

describe("WorkflowEditorPresenter: rule errors of a save (R303, Review Focus 3)", () => {
    it("marks the rule the server names by its id and shows the strip with its position", async () => {
        const { presenter, useCases, toasts } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                {
                    stepId: "step-1",
                    field: "config.assignment.rules.target",
                    workflowId: null,
                    ruleId: "r-2"
                },
                "The target user is not a member of the step's teams."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            {
                field: "config.assignment.rules.target",
                message: "The target user is not a member of the step's teams.",
                ruleId: "r-2"
            }
        ]);
        expect(presenter.vm.flow.steps[0].error).toBe(
            "Rule 2: The target user is not a member of the step's teams."
        );
        expect(presenter.vm.scrollRequest).toEqual({ stepId: "step-1", nonce: 1 });
        expect(toasts.error).toHaveBeenCalledWith("Could not save. Check the highlighted step.");
    });

    it("converts the index of a schema failure to the rule's id when it maps the error", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                {
                    stepId: "step-1",
                    field: "config.assignment.rules.1.target.id",
                    workflowId: null
                },
                "Required."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.assignment.rules.target.id", message: "Required.", ruleId: "r-2" }
        ]);
        expect(presenter.vm.flow.steps[0].error).toBe("Rule 2: Required.");
    });

    it("keeps an error that names no rule as it is, with a null rule id", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                {
                    stepId: "step-1",
                    field: "config.assignment.rules.9.target.id",
                    workflowId: null
                },
                "Required."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.assignment.rules.target.id", message: "Required.", ruleId: null }
        ]);
        expect(presenter.vm.flow.steps[0].error).toBe("Required.");
    });

    it("gives a field error that is not a rule error a null rule id", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                { stepId: "step-1", field: "config.teams", workflowId: null },
                "Step needs a team."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.teams", message: "Step needs a team.", ruleId: null }
        ]);
    });

    it("keeps the error for the drawer when the step is opened, and clears it when the step is edited", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                {
                    stepId: "step-1",
                    field: "config.assignment.rules.target",
                    workflowId: null,
                    ruleId: "r-1"
                },
                "The target team is not one of the step's reviewing teams."
            )
        );
        await presenter.save();

        presenter.openStep("step-1");
        expect(presenter.vm.openStepId).toBe("step-1");
        expect(presenter.getStepFieldErrors("step-1")[0].ruleId).toBe("r-1");

        presenter.updateStep("step-1", { title: "Renamed" });

        expect(presenter.getStepFieldErrors("step-1")).toEqual([]);
        expect(presenter.vm.flow.steps[0].error).toBeNull();
    });

    it("gives a client validation error the same field and rule id (R304)", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createRoutingStep([
                        createStoredRule({ id: "r-1", target: { type: "user", id: "user-1" } }),
                        createStoredRule({ id: "r-2", target: null })
                    ])
                ]
            })
        );
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);
        setup.listWorkflowUsers.execute.mockResolvedValue({
            users: [createListedUser("user-1", "Ada Lovelace")],
            missingIds: []
        });
        await setup.presenter.init(setup.params);
        setup.presenter.setName("Changed");

        await setup.presenter.save();

        expect(setup.presenter.getStepFieldErrors("step-1")).toContainEqual({
            field: "config.assignment.rules.target",
            message: "Choose who this rule assigns to.",
            ruleId: "r-2"
        });
        expect(setup.presenter.vm.flow.steps[0].error).toBe(
            "Rule 2: Choose who this rule assigns to."
        );
        expect(setup.useCases.storeWorkflow).not.toHaveBeenCalled();
        expect(setup.toasts.error).toHaveBeenCalledWith("Fix the highlighted steps before saving.");
    });
});
