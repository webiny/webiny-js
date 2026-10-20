import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import { toStepInput } from "~/editor/model/toStepInput.js";
import type { PeopleFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import { getPeopleStepPatch } from "~/editor/presentation/stepForm/getPeopleStepPatch.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createDrawerSetup } from "~/editor/testing/drawerPresenterKit.js";
import type { DrawerSetup } from "~/editor/testing/drawerPresenterKit.js";
import { createTwoRulesStep } from "~/editor/testing/drawerPresenterKit.js";
import { editAssignment } from "~/editor/testing/drawerPresenterKit.js";
import { editRules } from "~/editor/testing/drawerPresenterKit.js";
import { editTeams } from "~/editor/testing/drawerPresenterKit.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";
import { createTestInspection } from "~/editor/testing/routingStepFixtures.js";
import type { StepDrawerPresenter } from "./abstractions.js";

const matchedInspection = (): RoutingInspection => {
    return createTestInspection({
        owner: { id: "user-1", displayName: "Ada Lovelace" },
        source: "rule",
        ruleId: "r-1",
        trace: [
            { ruleId: "r-1", outcome: "matched", reason: null, failedConditions: [] },
            { ruleId: "r-2", outcome: "notEvaluated", reason: null, failedConditions: [] }
        ]
    });
};

// An open People step with two rules, a requester chosen and a result ready for the evaluator.
const openWithRequester = (): DrawerSetup => {
    const setup = createDrawerSetup([createTwoRulesStep()]);
    setup.source.inspectRouting.mockResolvedValue(matchedInspection());
    setup.presenter.open(setup.source, "step-1");
    setup.presenter.setTestRequester("user-1");
    return setup;
};

const transportFailure = (): Error => {
    return new Error("down");
};

describe("StepDrawerPresenter: Test routing inputs and button (R300, Q59.2)", () => {
    it("cannot run without a requester and shows the hint", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);

        presenter.open(source, "step-1");

        expect(presenter.vm.testRouting).toEqual({
            requesterId: null,
            folderId: null,
            canRun: false,
            hint: "Choose a requester to test.",
            buttonLabel: "Test routing",
            status: "idle",
            stale: false,
            result: null,
            errorMessage: null
        });
    });

    it("can run once a requester is chosen, and keeps the folder", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);
        presenter.open(source, "step-1");

        presenter.setTestRequester("user-1");
        presenter.setTestFolder("f-1");

        expect(presenter.vm.testRouting).toMatchObject({
            requesterId: "user-1",
            folderId: "f-1",
            canRun: true,
            hint: null
        });

        presenter.setTestRequester(null);
        presenter.setTestFolder(null);

        expect(presenter.vm.testRouting).toMatchObject({ requesterId: null, folderId: null });
    });

    it("does not run without a requester", async () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);
        presenter.open(source, "step-1");

        await presenter.runTest();

        expect(source.inspectRouting).not.toHaveBeenCalled();
    });

    it("has no Test routing state for an Automation step or a read-only People step", () => {
        const automation = createDrawerSetup([createAutomationStep({ id: "step-1" })]);
        const readOnly = createDrawerSetup([createTwoRulesStep()], source => {
            source.readOnly = true;
        });

        automation.presenter.open(automation.source, "step-1");
        readOnly.presenter.open(readOnly.source, "step-1");

        expect(automation.presenter.vm.testRouting).toBeNull();
        expect(readOnly.presenter.vm.testRouting).toBeNull();
    });
});

describe("StepDrawerPresenter: running a test (R300, R301, Review Focus 6)", () => {
    it("shows Testing… and disables the button while running, then the result", async () => {
        const { presenter, source } = openWithRequester();
        const slow = createDeferred<RoutingInspection>();
        source.inspectRouting.mockReturnValue(slow.promise);

        const run = presenter.runTest();

        expect(presenter.vm.testRouting).toMatchObject({
            status: "running",
            buttonLabel: "Testing…",
            canRun: false,
            result: null
        });

        slow.resolve(matchedInspection());
        await run;

        expect(presenter.vm.testRouting).toMatchObject({
            status: "done",
            buttonLabel: "Test routing",
            canRun: true,
            stale: false
        });
        expect(presenter.vm.testRouting?.result?.ownerLabel).toBe("Ada Lovelace");
    });

    it("composes the result from the rules of the request and the resolved names", async () => {
        const { presenter, source } = openWithRequester();

        await presenter.runTest();

        const result = presenter.vm.testRouting?.result;
        expect(source.resolveInspectionNames).toHaveBeenCalledWith(matchedInspection());
        expect(result?.reason).toBe("Assigned by rule 1");
        expect(result?.trace.map(row => row.tag)).toEqual(["Matched", "Skipped"]);
        expect(result?.trace[0].label.startsWith("Rule 1: ")).toBe(true);
    });

    it("names the team of a one-team step when no rule matched", async () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.references = createRuleReferences({
                teams: [{ id: "team-1", label: "Editors", state: "found" }]
            });
        });
        source.inspectRouting.mockResolvedValue(createTestInspection());
        presenter.open(source, "step-1");
        presenter.setTestRequester("user-1");

        await presenter.runTest();

        expect(presenter.vm.testRouting?.result?.reason).toBe(
            "No rule matched; waits in the Editors team pool."
        );
    });

    it("uses the resolved names in the strategy line", async () => {
        const { presenter, source } = openWithRequester();
        source.inspectRouting.mockResolvedValue(
            createTestInspection({
                owner: { id: "user-2", displayName: "Grace Hopper" },
                source: "roundRobin",
                strategy: "roundRobin",
                candidateIds: ["user-2", "user-3"],
                candidateCount: 2
            })
        );
        source.resolveInspectionNames.mockResolvedValue({
            users: new Map([
                ["user-2", "Grace Hopper"],
                ["user-3", "Alan Turing"]
            ]),
            teams: new Map()
        });

        await presenter.runTest();

        expect(presenter.vm.testRouting?.result?.strategyLine).toContain("Grace Hopper");
    });

    it("sends exactly what toStepInput emits for the draft step with the form values applied", async () => {
        const step = createTwoRulesStep();
        const { presenter, source } = createDrawerSetup([step]);
        source.inspectRouting.mockResolvedValue(matchedInspection());
        presenter.open(source, "step-1");
        presenter.setTestRequester("user-1");
        presenter.setTestFolder("f-1");
        editAssignment(presenter, { strategy: "roundRobin", allowManualPick: true });
        // A rule without a target is sent too: the server answers with its own message.
        editRules(presenter, rules => {
            const incomplete = {
                id: "r-3",
                requesterUserId: null,
                requesterTeamId: null,
                folder: null,
                target: null,
                preserved: {}
            };
            return [...rules, incomplete];
        });
        editTeams(presenter, ["team-1", "team-2"]);

        await presenter.runTest();

        expect(source.inspectRouting).toHaveBeenCalledTimes(1);
        const request = source.inspectRouting.mock.calls[0][0];
        const values = presenter.vm.form?.getData() as unknown as PeopleFormValues;
        const patch = getPeopleStepPatch(step, values);
        const stepInput = toStepInput({ ...step, ...patch });
        const config = readReviewConfig(stepInput.config);
        expect(request.stepConfig).toEqual({ teams: config.teams, assignment: config.assignment });
        expect(request.stepConfig.teams).toEqual(["team-1", "team-2"]);
        expect(request.stepConfig.assignment).toMatchObject({
            strategy: "roundRobin",
            allowManualPick: true
        });
        const sentRules = request.stepConfig.assignment.rules;
        expect(Array.isArray(sentRules) && sentRules.length).toBe(3);
        expect(request.requesterId).toBe("user-1");
        expect(request.folderId).toBe("f-1");
    });

    it("sends a null folder for the root", async () => {
        const { presenter, source } = openWithRequester();

        await presenter.runTest();

        expect(source.inspectRouting.mock.calls[0][0].folderId).toBeNull();
    });

    it("ignores a second runTest while one is running", async () => {
        const { presenter, source } = openWithRequester();
        const slow = createDeferred<RoutingInspection>();
        source.inspectRouting.mockReturnValue(slow.promise);

        const first = presenter.runTest();
        const second = presenter.runTest();
        slow.resolve(matchedInspection());
        await first;
        await second;

        expect(source.inspectRouting).toHaveBeenCalledTimes(1);
    });
});

describe("StepDrawerPresenter: a result that is out of date (R300, Review Focus 6)", () => {
    const edits: Array<[string, (presenter: StepDrawerPresenter.Interface) => void]> = [
        ["teams", presenter => editTeams(presenter, ["team-1", "team-2"])],
        ["strategy", presenter => editAssignment(presenter, { strategy: "leastLoaded" })],
        ["toggle", presenter => editAssignment(presenter, { allowManualPick: true })],
        ["rules", presenter => editRules(presenter, rules => rules.slice(1))],
        ["requester", presenter => presenter.setTestRequester("user-2")],
        ["folder", presenter => presenter.setTestFolder("f-9")]
    ];

    it.each(edits)(
        "is stale after a change of the %s, and is not run again",
        async (_name, edit) => {
            const { presenter, source } = openWithRequester();
            await presenter.runTest();
            expect(presenter.vm.testRouting?.stale).toBe(false);

            edit(presenter);

            expect(presenter.vm.testRouting?.stale).toBe(true);
            expect(presenter.vm.testRouting?.result).not.toBeNull();
            expect(source.inspectRouting).toHaveBeenCalledTimes(1);
        }
    );

    it("is not stale after a change the test does not depend on", async () => {
        const { presenter } = openWithRequester();
        await presenter.runTest();
        const form = presenter.vm.form;

        form?.setData({ ...form.getData(), title: "Renamed" }, { dirty: true });

        expect(presenter.vm.testRouting?.stale).toBe(false);
    });

    it("keeps the old rule numbering when the rules are reordered after the result", async () => {
        const { presenter } = openWithRequester();
        await presenter.runTest();

        editRules(presenter, rules => [...rules].reverse());

        const trace = presenter.vm.testRouting?.result?.trace;
        expect(presenter.vm.testRouting?.stale).toBe(true);
        expect(trace?.[0].ruleId).toBe("r-1");
        expect(trace?.[0].label.startsWith("Rule 1: ")).toBe(true);
    });

    it("lets an edit made while running make the result arrive stale", async () => {
        const { presenter, source } = openWithRequester();
        const slow = createDeferred<RoutingInspection>();
        source.inspectRouting.mockReturnValue(slow.promise);

        const run = presenter.runTest();
        editRules(presenter, rules => rules.slice(0, 1));
        slow.resolve(matchedInspection());
        await run;

        expect(presenter.vm.testRouting).toMatchObject({ status: "done", stale: true });
    });

    it("can be run again after it went stale, and the new result is current", async () => {
        const { presenter, source } = openWithRequester();
        await presenter.runTest();
        presenter.setTestFolder("f-9");
        expect(presenter.vm.testRouting?.stale).toBe(true);

        await presenter.runTest();

        expect(source.inspectRouting).toHaveBeenCalledTimes(2);
        expect(presenter.vm.testRouting?.stale).toBe(false);
    });
});

describe("StepDrawerPresenter: a failed test (R300, Q59.3, R306)", () => {
    it("shows the server message of a Validation error, clears the result and runs again on Try again", async () => {
        const { presenter, source } = openWithRequester();
        await presenter.runTest();
        source.inspectRouting.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.Validation,
                message: "Choose who this rule assigns to.",
                data: null
            })
        );
        presenter.setTestFolder("f-1");

        await presenter.runTest();

        expect(presenter.vm.testRouting).toMatchObject({
            status: "failed",
            errorMessage: "Could not test routing: Choose who this rule assigns to.",
            result: null,
            stale: false,
            canRun: true
        });

        source.inspectRouting.mockResolvedValue(matchedInspection());
        await presenter.runTest();

        expect(presenter.vm.testRouting).toMatchObject({ status: "done", errorMessage: null });
    });

    it("shows the transport text for a transport failure and for a server error that is not a validation error", async () => {
        const first = openWithRequester();
        first.source.inspectRouting.mockRejectedValue(transportFailure());
        const second = openWithRequester();
        second.source.inspectRouting.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.NotAuthorized,
                message: "No.",
                data: null
            })
        );

        await first.presenter.runTest();
        await second.presenter.runTest();

        for (const { presenter } of [first, second]) {
            expect(presenter.vm.testRouting?.errorMessage).toBe(
                "Could not test routing: the server did not respond."
            );
            expect(presenter.vm.testRouting?.status).toBe("failed");
        }
    });
});

describe("StepDrawerPresenter: a builder that throws while running a test (final wave 5)", () => {
    it("ends in the failed state and does not reject", async () => {
        const { presenter, source } = openWithRequester();
        const form = presenter.vm.form;
        // A form value no step input can be built from.
        form?.setData({ ...form.getData(), assignment: { rules: "oops" } });

        await expect(presenter.runTest()).resolves.toBeUndefined();

        expect(source.inspectRouting).not.toHaveBeenCalled();
        expect(presenter.vm.testRouting?.status).toBe("failed");
    });
});

describe("StepDrawerPresenter: Test routing state per open step (R300, Review Focus 6)", () => {
    const twoPeopleSteps = () => {
        const second = createRoutingStep(
            [createStoredRule({ id: "r-9", target: { type: "user", id: "user-9" } })],
            ["team-1"],
            "step-2"
        );
        return [createTwoRulesStep(), second];
    };

    it("clears the state when another step opens", async () => {
        const { presenter, source } = createDrawerSetup(twoPeopleSteps());
        source.inspectRouting.mockResolvedValue(matchedInspection());
        presenter.open(source, "step-1");
        presenter.setTestRequester("user-1");
        await presenter.runTest();

        presenter.open(source, "step-2");

        expect(presenter.vm.testRouting).toMatchObject({
            requesterId: null,
            folderId: null,
            status: "idle",
            result: null
        });
    });

    it("clears the state when the drawer is closed and reopened for the same step", async () => {
        const { presenter, source } = createDrawerSetup(twoPeopleSteps());
        source.inspectRouting.mockResolvedValue(matchedInspection());
        presenter.open(source, "step-1");
        presenter.setTestRequester("user-1");
        await presenter.runTest();

        presenter.close();
        presenter.open(source, "step-1");

        expect(presenter.vm.testRouting).toMatchObject({
            requesterId: null,
            status: "idle",
            result: null
        });
    });

    it("drops the response of a run when another step was opened meanwhile", async () => {
        const { presenter, source } = createDrawerSetup(twoPeopleSteps());
        const slow = createDeferred<RoutingInspection>();
        source.inspectRouting.mockReturnValue(slow.promise);
        presenter.open(source, "step-1");
        presenter.setTestRequester("user-1");

        const run = presenter.runTest();
        presenter.open(source, "step-2");
        slow.resolve(matchedInspection());
        await run;

        expect(presenter.vm.testRouting).toMatchObject({ status: "idle", result: null });
        expect(source.resolveInspectionNames).not.toHaveBeenCalled();
    });

    it("drops the response of a run when the drawer was closed and reopened meanwhile", async () => {
        const { presenter, source } = createDrawerSetup(twoPeopleSteps());
        const slow = createDeferred<RoutingInspection>();
        source.inspectRouting.mockReturnValue(slow.promise);
        presenter.open(source, "step-1");
        presenter.setTestRequester("user-1");

        const run = presenter.runTest();
        presenter.close();
        presenter.open(source, "step-1");
        slow.resolve(matchedInspection());
        await run;

        expect(presenter.vm.testRouting).toMatchObject({ status: "idle", result: null });
    });

    it("drops the response of an older run after the state was reset and run again", async () => {
        const { presenter, source } = createDrawerSetup(twoPeopleSteps());
        const slow = createDeferred<RoutingInspection>();
        source.inspectRouting.mockReturnValueOnce(slow.promise);
        presenter.open(source, "step-1");
        presenter.setTestRequester("user-1");
        const older = presenter.runTest();

        presenter.open(source, "step-1");
        presenter.setTestRequester("user-2");
        source.inspectRouting.mockResolvedValueOnce(
            createTestInspection({ owner: { id: "user-2", displayName: "Grace Hopper" } })
        );
        await presenter.runTest();
        slow.resolve(matchedInspection());
        await older;

        expect(presenter.vm.testRouting?.result?.ownerLabel).toBe("Grace Hopper");
    });
});
