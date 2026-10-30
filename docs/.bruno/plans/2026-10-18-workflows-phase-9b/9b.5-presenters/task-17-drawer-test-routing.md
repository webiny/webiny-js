### Task 17: `StepDrawerPresenter` Test routing state

R300, R301, R306, R315; D172; Q55, Q59.2, Q59.3; Review Focus 6 and 7; QBZ-16. The drawer presenter holds the Test routing state of the open People step and runs the server's evaluator on the unsaved step (R300). The state is one record per open step, `TestRoutingState { requesterId, folderId, status, result, errorMessage, signature }`, in the drawer presenter; opening another step, closing the drawer and reopening the same step all clear it.

- **Inputs and button:** the requester and the folder come from `setTestRequester(id)` and `setTestFolder(id)` (they are `WorkflowPicker`s, R315, not form fields). `vm.testRouting.canRun` needs a requester and no run in flight; without a requester `hint` is `Choose a requester to test.`; while running `buttonLabel` is `Testing…`, otherwise `Test routing`.
- **The request:** `source.inspectRouting({ stepConfig, requesterId, folderId })` where `stepConfig` is `{ teams, assignment }` of exactly what `toStepInput` emits for the draft step with the drawer's current form values applied (`getPeopleStepPatch`, rules without a target included, so the server's own message comes back as `Could not test routing: {message}`). The editor presenter adds the `modelId` (Task 14b, `getModelId()`).
- **Run token:** every run takes a token, and `reset` (open, close, finish, dispose) bumps it, so the response of another step, a closed drawer or an older run is dropped. `runTest` while `running` is a no-op. Re-running after a failure or a done result is allowed (`Try again`, `Test again`).
- **Signature and stale:** the signature (`getTestRoutingSignature` of teams, strategy, toggle, rules, requester and folder, Task 13) is taken when the request is sent. The `TestRoutingResultVm` is composed when the response arrives (after `source.resolveInspectionNames`, Task 14c) from the rules, the strategy and the references of the request, so a result keeps its old rule numbering after a reorder and an edit made while running makes the result arrive stale. A done result is stale when the current signature differs from the stored one; it keeps the old result and is never re-run automatically.
- **Failure (R300, Q59.3):** the result is cleared. A `Validation` error shows `Could not test routing: {server message}`; every other error (a transport failure, `NotAuthorized`, R306) shows `Could not test routing: the server did not respond.`.
- **Scope:** `vm.testRouting` is null for a step that is not a People step and for a read-only People step (teams off).

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/TestRoutingState.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/testRoutingMessages.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/getTestRoutingFailureMessage.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/buildTestRoutingVm.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/testRoutingPure.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.testRouting.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.ts`

**Interfaces:**
- Consumes: Task 13 (`TestRoutingInput { stepId; teams; strategy; allowManualPick; rules; requesterId; folderId }`, `getTestRoutingSignature(input): string`, `composeTestRoutingResult(inspection, context): TestRoutingResultVm`, `TestRoutingContext { rules; strategy; references; names }`, `TestRoutingResultVm`), Task 14b (`StepDrawerSource.inspectRouting`, the fake's `inspectRouting` mock, `createTestInspection`), Task 14c (`StepDrawerSource.resolveInspectionNames`, the fake's mock), Task 16 (`drawerPresenterKit`: `createDrawerSetup`, `createTwoRulesStep`, `editRules`, `editAssignment`, `editTeams`; `reset`; the People form with `assignment`), Task 18's form part (`getPeopleStepPatch`, `PeopleFormValues.assignment`), Task 7 (`RoutingStepConfig`), 9a (`toStepInput`, `readReviewConfig`, `createDefaultAssignment`, `GraphQLOperationError`, `WorkflowErrorCode`, `createDeferred`).
- Produces: `TestRoutingVm { requesterId: string | null; folderId: string | null; canRun: boolean; hint: string | null; buttonLabel: "Test routing" | "Testing…"; status: "idle" | "running" | "done" | "failed"; stale: boolean; result: TestRoutingResultVm | null; errorMessage: string | null }`, `StepDrawerVm.testRouting: TestRoutingVm | null`, `StepDrawerPresenter.setTestRequester(id: string | null): void`, `StepDrawerPresenter.setTestFolder(id: string | null): void`, `StepDrawerPresenter.runTest(): Promise<void>`, `TestRoutingState`, `TEST_ROUTING_MESSAGES`, `buildTestRoutingVm`, `getTestRoutingFailureMessage`.

**Test runner note:** admin package, `yarn test <path>` only. Type check: `yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30`.

- [ ] **Step 0: Preconditions**

Tasks 13, 14b, 14c and 16 are committed, and so is the form part of Task 18 (see the order note of Task 16).

```bash
cd /Users/brunozoric/work/webiny/webiny-js
ls packages/app-workflows/src/editor/model/testRouting/
ls packages/app-workflows/src/editor/testing/drawerPresenterKit.ts
grep -n "inspectRouting\|resolveInspectionNames" packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts
```

`TestRoutingContext.stepTeamIds` (optional, Task 13) must exist; the composer sentences asserted below are R301's: owner `Assigned by rule {n}`, tags `Matched` / `Not matched` / `Skipped` (`notEvaluated` shows `Skipped`), row labels `Rule {n}: {summary}`. If Task 13 words a line differently, change the assertion to Task 13's text and record it under "Contract notes".

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/stepDrawer/testRoutingPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { buildTestRoutingVm } from "./buildTestRoutingVm.js";
import { createTestRoutingState } from "./TestRoutingState.js";
import { getTestRoutingFailureMessage } from "./getTestRoutingFailureMessage.js";

describe("buildTestRoutingVm (R300, Q59.2)", () => {
    it("cannot run without a requester and says why", () => {
        const vm = buildTestRoutingVm({ state: createTestRoutingState(), currentSignature: "a" });

        expect(vm).toEqual({
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

    it("can run with a requester and shows no hint", () => {
        const vm = buildTestRoutingVm({
            state: { ...createTestRoutingState(), requesterId: "user-1", folderId: "f-1" },
            currentSignature: "a"
        });

        expect(vm.canRun).toBe(true);
        expect(vm.hint).toBeNull();
        expect(vm.requesterId).toBe("user-1");
        expect(vm.folderId).toBe("f-1");
    });

    it("shows Testing… and cannot run again while running", () => {
        const vm = buildTestRoutingVm({
            state: { ...createTestRoutingState(), requesterId: "user-1", status: "running" },
            currentSignature: "a"
        });

        expect(vm.buttonLabel).toBe("Testing…");
        expect(vm.canRun).toBe(false);
        expect(vm.status).toBe("running");
        expect(vm.result).toBeNull();
    });

    it("marks a done result stale when the signature differs, and keeps the result", () => {
        const result = {
            ownerLabel: "Team pool",
            ownerIcon: "groups" as const,
            reason: "No rule matched; waits in the team pool.",
            trace: [],
            strategyLine: "None: the step waits in the team pool.",
            skipped: []
        };
        const state = {
            ...createTestRoutingState(),
            requesterId: "user-1",
            status: "done" as const,
            result,
            signature: "a"
        };

        expect(buildTestRoutingVm({ state, currentSignature: "a" }).stale).toBe(false);
        const stale = buildTestRoutingVm({ state, currentSignature: "b" });
        expect(stale.stale).toBe(true);
        expect(stale.result).toBe(result);
    });

    it("shows the error of a failed run and no result", () => {
        const vm = buildTestRoutingVm({
            state: {
                ...createTestRoutingState(),
                requesterId: "user-1",
                status: "failed",
                errorMessage: "Could not test routing: the server did not respond.",
                signature: "a"
            },
            currentSignature: "b"
        });

        expect(vm.errorMessage).toBe("Could not test routing: the server did not respond.");
        expect(vm.result).toBeNull();
        expect(vm.stale).toBe(false);
        expect(vm.canRun).toBe(true);
    });
});

describe("getTestRoutingFailureMessage (R300, R306, Q59.3)", () => {
    it("shows the server message of a Validation error", () => {
        const error = new GraphQLOperationError({
            code: WorkflowErrorCode.Validation,
            message: "Choose who this rule assigns to.",
            data: null
        });

        expect(getTestRoutingFailureMessage(error)).toBe(
            "Could not test routing: Choose who this rule assigns to."
        );
    });

    it("shows the transport text for a transport failure and any other server error", () => {
        const transport = getTestRoutingFailureMessage(new Error("down"));
        const denied = getTestRoutingFailureMessage(
            new GraphQLOperationError({
                code: WorkflowErrorCode.NotAuthorized,
                message: "No.",
                data: null
            })
        );

        expect(transport).toBe("Could not test routing: the server did not respond.");
        expect(denied).toBe("Could not test routing: the server did not respond.");
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.testRouting.test.ts`:

```ts
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
        const values = presenter.vm.form?.getData() as PeopleFormValues;
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

    it.each(edits)("is stale after a change of the %s, and is not run again", async (_name, edit) => {
        const { presenter, source } = openWithRequester();
        await presenter.runTest();
        expect(presenter.vm.testRouting?.stale).toBe(false);

        edit(presenter);

        expect(presenter.vm.testRouting?.stale).toBe(true);
        expect(presenter.vm.testRouting?.result).not.toBeNull();
        expect(source.inspectRouting).toHaveBeenCalledTimes(1);
    });

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
```

- [ ] **Step 2: Run the tests and expect failure**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/testRoutingPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.testRouting.test.ts 2>&1 | tail -40
```

Expected: the first fails with `Failed to resolve import "./buildTestRoutingVm.js"`; the second with `presenter.setTestRequester is not a function`.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepDrawer/testRoutingMessages.ts`:

```ts
// Copy of the Test routing tab's inputs and failures (R300, Q59.2, Q59.3, design README 4).
export const TEST_ROUTING_MESSAGES = {
    chooseRequester: "Choose a requester to test.",
    button: "Test routing",
    running: "Testing…",
    failedPrefix: "Could not test routing: ",
    noResponse: "Could not test routing: the server did not respond."
} as const;
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/TestRoutingState.ts`:

```ts
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";

export type TestRoutingStatus = "idle" | "running" | "done" | "failed";

// The Test routing state of one open step (R300); the drawer presenter replaces it, never mutates it.
export interface TestRoutingState {
    requesterId: string | null;
    folderId: string | null;
    status: TestRoutingStatus;
    result: TestRoutingResultVm | null;
    errorMessage: string | null;
    // The signature of the inputs when the last request was sent; null before the first run.
    signature: string | null;
}

export const createTestRoutingState = (): TestRoutingState => {
    return {
        requesterId: null,
        folderId: null,
        status: "idle",
        result: null,
        errorMessage: null,
        signature: null
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/getTestRoutingFailureMessage.ts`:

```ts
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { TEST_ROUTING_MESSAGES } from "./testRoutingMessages.js";

/*
 * The failure text of a Test routing run (R300, R306): a Validation error carries the server's
 * message (a rule without a target, a target outside the teams); a transport failure and any other
 * server error, `NotAuthorized` included, show that the server did not respond. Pure.
 */
export const getTestRoutingFailureMessage = (error: unknown): string => {
    if (error instanceof GraphQLOperationError && error.code === WorkflowErrorCode.Validation) {
        return `${TEST_ROUTING_MESSAGES.failedPrefix}${error.message}`;
    }
    return TEST_ROUTING_MESSAGES.noResponse;
};
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/buildTestRoutingVm.ts`:

```ts
import type { TestRoutingState } from "./TestRoutingState.js";
import type { TestRoutingVm } from "./abstractions.js";
import { TEST_ROUTING_MESSAGES } from "./testRoutingMessages.js";

export interface BuildTestRoutingVmParams {
    state: TestRoutingState;
    // `getTestRoutingSignature` of the inputs as they are now.
    currentSignature: string;
}

/*
 * The render-ready Test routing state (R234, R300). A done result is stale when the current
 * signature differs from the one taken when the request was sent; the old result is kept. A failed
 * run has no result. Pure.
 */
export const buildTestRoutingVm = (params: BuildTestRoutingVmParams): TestRoutingVm => {
    const state = params.state;
    const running = state.status === "running";
    const hasRequester = state.requesterId !== null;

    return {
        requesterId: state.requesterId,
        folderId: state.folderId,
        canRun: hasRequester && !running,
        hint: hasRequester ? null : TEST_ROUTING_MESSAGES.chooseRequester,
        buttonLabel: running ? TEST_ROUTING_MESSAGES.running : TEST_ROUTING_MESSAGES.button,
        status: state.status,
        stale: state.status === "done" && state.signature !== params.currentSignature,
        result: state.status === "done" ? state.result : null,
        errorMessage: state.status === "failed" ? state.errorMessage : null
    };
};
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`: add

```ts
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import type { TestRoutingStatus } from "./TestRoutingState.js";
```

after `RuleErrorVm`:

```ts
// The Test routing tab's state, render-ready (R300).
export interface TestRoutingVm {
    requesterId: string | null;
    folderId: string | null;
    canRun: boolean;
    // `Choose a requester to test.` without a requester, else null.
    hint: string | null;
    buttonLabel: "Test routing" | "Testing…";
    status: TestRoutingStatus;
    // A done result whose configuration or inputs changed since the run.
    stale: boolean;
    result: TestRoutingResultVm | null;
    // `Could not test routing: …` after a failed run, else null.
    errorMessage: string | null;
}
```

in `IStepDrawerViewModel`, after `ruleIssues`:

```ts
    // The Test routing tab of a People step; null for any other step and for a read-only one (R300).
    testRouting: TestRoutingVm | null;
```

in `IStepDrawerPresenter`, after `clearRuleError(ruleId: string): void;`:

```ts
    // The Test routing inputs (R315) and the run (R300).
    setTestRequester(id: string | null): void;
    setTestFolder(id: string | null): void;
    runTest(): Promise<void>;
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.ts`.

Imports:

```ts
import type { RoutingStepConfig } from "~/editor/domain/types.js";
import { createDefaultAssignment } from "~/editor/model/createDefaultAssignment.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import { toStepInput } from "~/editor/model/toStepInput.js";
import { composeTestRoutingResult } from "~/editor/model/testRouting/composeTestRoutingResult.js";
import { getTestRoutingSignature } from "~/editor/model/testRouting/getTestRoutingSignature.js";
import type { TestRoutingInput } from "~/editor/model/testRouting/TestRoutingInput.js";
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import { buildTestRoutingVm } from "./buildTestRoutingVm.js";
import { getTestRoutingFailureMessage } from "./getTestRoutingFailureMessage.js";
import { createTestRoutingState } from "./TestRoutingState.js";
import type { TestRoutingState } from "./TestRoutingState.js";
import type { TestRoutingVm } from "./abstractions.js";
```

(`EditorStep`, `getPeopleStepPatch` and `PeopleFormValues` are imported already.)

Fields, after `private markedRules`:

```ts
    // The Test routing state of the open step and the token of its latest run (R300).
    private testRouting: TestRoutingState = createTestRoutingState();
    private testToken = 0;
```

in the `makeAutoObservable` generic list add `| "testRouting" | "testToken"`, and in the options (after `markedRules: observableRef`):

```ts
            markedRules: observableRef,
            testRouting: observableRef,
            testToken: false
```

`vm` getter: add to the returned object after `ruleIssues`:

```ts
            ruleIssues,
            testRouting: this.getTestRoutingVm()
```

Public methods, after `clearRuleError`:

```ts
    setTestRequester(id: string | null): void {
        this.testRouting = { ...this.testRouting, requesterId: id };
    }

    setTestFolder(id: string | null): void {
        this.testRouting = { ...this.testRouting, folderId: id };
    }

    async runTest(): Promise<void> {
        const source = this.source;
        const step = this.step;
        const form = this.form;
        if (source === null || step === null || form === null) {
            return;
        }
        if (this.kind !== "review" || this.isReadOnly()) {
            return;
        }
        const requesterId = this.testRouting.requesterId;
        const folderId = this.testRouting.folderId;
        if (requesterId === null || this.testRouting.status === "running") {
            return;
        }
        const input = this.getTestRoutingInput();
        if (input === null) {
            return;
        }

        // The configuration on screen, as Save would send it (R300).
        const data = form.getData();
        const values = data as PeopleFormValues;
        const patch = getPeopleStepPatch(step, values);
        const draftStep: EditorStep = { ...step, ...patch };
        const stepInput = toStepInput(draftStep);
        const config = readReviewConfig(stepInput.config);
        const stepConfig: RoutingStepConfig = {
            teams: config.teams,
            // The spread gives a plain object type, which is assignable to the record.
            assignment: config.assignment ?? { ...createDefaultAssignment() }
        };

        this.testToken += 1;
        const token = this.testToken;
        const signature = getTestRoutingSignature(input);
        this.startTest(signature);
        try {
            const inspection = await source.inspectRouting({ stepConfig, requesterId, folderId });
            if (token !== this.testToken) {
                return;
            }
            const names = await source.resolveInspectionNames(inspection);
            if (token !== this.testToken) {
                return;
            }
            const references = source.getReferences();
            const result = composeTestRoutingResult(inspection, {
                rules: input.rules,
                strategy: input.strategy,
                stepTeamIds: input.teams,
                references,
                names
            });
            this.finishTest(result);
        } catch (error) {
            if (token === this.testToken) {
                this.failTest(getTestRoutingFailureMessage(error));
            }
        }
    }
```

`reset()` — add after `this.markedRules = [];`:

```ts
        this.testToken += 1;
        this.testRouting = createTestRoutingState();
```

Private methods, before `getMemberSearchKey`:

```ts
    private startTest(signature: string): void {
        this.testRouting = {
            ...this.testRouting,
            status: "running",
            result: null,
            errorMessage: null,
            signature
        };
    }

    private finishTest(result: TestRoutingResultVm): void {
        this.testRouting = { ...this.testRouting, status: "done", result, errorMessage: null };
    }

    private failTest(message: string): void {
        this.testRouting = {
            ...this.testRouting,
            status: "failed",
            result: null,
            errorMessage: message
        };
    }

    // What the Test routing signature and the composer read: the People form as it is now.
    private getTestRoutingInput(): TestRoutingInput | null {
        if (this.form === null || this.kind !== "review") {
            return null;
        }
        const data = this.form.getData();
        const values = data as PeopleFormValues;
        const assignment = values.assignment;
        return {
            stepId: this.stepId,
            teams: values.teams ?? [],
            strategy: assignment.strategy,
            allowManualPick: assignment.allowManualPick,
            rules: assignment.rules,
            requesterId: this.testRouting.requesterId,
            folderId: this.testRouting.folderId
        };
    }

    private getTestRoutingVm(): TestRoutingVm | null {
        if (this.kind !== "review" || this.isReadOnly()) {
            return null;
        }
        const input = this.getTestRoutingInput();
        if (input === null) {
            return null;
        }
        const currentSignature = getTestRoutingSignature(input);
        return buildTestRoutingVm({ state: this.testRouting, currentSignature });
    }
```

- [ ] **Step 4: Run the tests and expect them to pass**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/testRoutingPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.testRouting.test.ts 2>&1 | tail -40
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code, then the type check**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.assignment.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: pass, no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git restore --source=HEAD --staged --worktree .gitleaks.toml
git commit -m "feat(app-workflows): the step drawer runs Test routing on the unsaved step" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

**Contract notes:**
- `modelId` is added by the editor presenter's `inspectRouting` (Task 14b, asserted there against the real use case fake): the drawer sends `DrawerInspectParams` without it, so the drawer test asserts the payload without `modelId`.
- The contract lists `TestRoutingState.ts`; it holds the state record and its idle factory. The pure view-model step is `buildTestRoutingVm.ts`, the failure texts `getTestRoutingFailureMessage.ts` and the copy `testRoutingMessages.ts`.
- Requester and folder changes are accepted while a run is in flight (the view disables the inputs while `status` is `running`, Task 22); a change arrives as a stale result, which is R300's rule for any edit during a run.
- The order conflict of Task 16 applies here: the People form with `assignment` (the form part of Task 18) must exist.

**Review fixes (sub-phase review):**
- The composer context now carries `stepTeamIds: input.teams` (Task 13's optional field; the review of 9b.4 asks for it), with a test that a one-team step names its team in `No rule matched; waits in the Editors team pool.`.
- The default assignment is spread (`{ ...createDefaultAssignment() }`) so the `stepConfig.assignment` assignment type-checks (an interface is not assignable to `Record<string, unknown>`).
- The kit and fixtures: `createRuleReferences` comes from Task 11's `ruleFixtures.ts`.
