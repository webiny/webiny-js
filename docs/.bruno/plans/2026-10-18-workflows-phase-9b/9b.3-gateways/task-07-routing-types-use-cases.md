### Task 7: Shared routing types, mapper and use-case methods

R289, R291, R292 (`FolderExistsParams`), R301 (what the composer reads), D133, D172, D173; Q54, Q55; Review Focus 6, 7 (`00-shared.md`). The phase 9a Global Constraints and Rulings R202-R284 apply unchanged (read: the envelope contract R204, the subclass rule R237 for the shared use-case class, one public function per file, one named import per line, no inline object types, no nested call arguments, comments end with a period, targeted tests, the pre-commit chain, the editor-only gate).

The editor gets two per-app operations, `inspectRouting` and `folderExists`, as part of the per-app `IWorkflowEditorGateway` and `IWorkflowEditorUseCases` (the apps' GraphQL documents are Task 7b). This task is everything the two apps share: the domain types of the inspector's answer, the DTOs, the mapper, the two gateway methods on the interface, the two use-case methods on the shared plain class and the fakes. Task 4's SDL is the server side: `WorkflowsRoutingInspection` with `owner`, `source`, `ruleId`, `strategy`, `narrowedTeamId`, `candidateIds`, `candidateCount`, `trace { ruleId outcome reason failedConditions }` and `skipped { userId displayName reason }`, where `outcome` is `matched | notMatched | skipped | notEvaluated` and a failed condition is `requesterUser | requesterTeam | folder` (R289).

- **Domain** (`[AWE]/domain/types.ts`): `RoutingCondition = "requesterUser" | "requesterTeam" | "folder"`, `RoutingTraceOutcome = "matched" | "notMatched" | "skipped" | "notEvaluated"`, `RoutingSource = "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool"` (the server's `RoutingSource`), `RoutingTraceEntry`, `RoutingSkippedPerson`, `RoutingOwner`, `RoutingInspection`, `RoutingStepConfig` exactly as the contract's Interfaces entry lists them. `RoutingInspection.strategy` is the contract's `AssignmentStrategy`: `AssignmentStrategy = "none" | "roundRobin" | "leastLoaded"` is created here in its own file `[AWE]/model/assignment/AssignmentStrategy.ts` because Task 9 (which the contract lists as its owner) comes after this task; Task 9 must treat the file as existing (Contract notes).
- **DTO** (`[AWE]/gateway/dto.ts`): `RoutingInspectionDto`, `RoutingTraceEntryDto`, `RoutingSkippedPersonDto`, `RoutingConditionDto`, `RoutingTraceOutcomeDto`, `RoutingSourceDto`: the server selection, `strategy` a plain `string` (SDL `String!`).
- **Fields fragment** (`[AWE]/gateway/editorFields.ts`): `EDITOR_ROUTING_INSPECTION_FIELDS` selects every R289 field once, so the CMS and WB documents of Task 7b share it (no logic or selection duplicated across the apps). `owner` selects `id` and `displayName` only (D104: no e-mail, roles or teams; no load numbers).
- **Mapper** (`[AWE]/gateway/mapRoutingInspection.ts`): copies every field, maps `owner` to `RoutingOwner | null`, narrows the strategy string to `AssignmentStrategy` (an unknown string becomes `none`; the server only sends the three), and fills the optional-looking fields defensively: an absent `failedConditions` is `[]`, an absent `candidateIds` `[]`, an absent `candidateCount` `0`, an absent `narrowedTeamId` or `reason` `null`. The trace keeps the server's order (the trace lists every rule in order, R289). Arrays are copied, never shared with the DTO.
- **Gateway** (`IWorkflowEditorGateway`): `inspectRouting(params: InspectRoutingParams): Promise<EditorEnvelope<RoutingInspectionDto>>` and `folderExists(params: FolderExistsParams): Promise<EditorEnvelope<boolean>>`, with `InspectRoutingParams { stepConfig: RoutingStepConfig; requesterId: string; folderId: string | null; modelId: string | null }` and `FolderExistsParams { id: string; type: string }` (R291). The envelope is returned as it is, also for a server error (R204).
- **Use cases** (`IWorkflowEditorUseCases` and the plain class `WorkflowEditorUseCases`): `inspectRouting(params)` throws `toOperationError(envelope.error)` for an error envelope or no data and otherwise returns `mapRoutingInspection(envelope.data)`. `folderExists(params)` throws for an error envelope or `data === null`, and returns `envelope.data` as it is: **`false` is an answer** (a deleted folder), so the check is `envelope.data === null`, not `!envelope.data`. A transport `Error` passes as it is. The class stays plain and exported un-bound; the CMS and WB subclasses of R237 inherit both methods without a line of code.
- **Fixtures and fakes** (`[AWET]`): `createRoutingInspectionDto` and `createRoutingInspection` in `editorFixtures.ts` (a rule decision for rule `rule-1`, owner `user-2` "Ivan Horvat", one matched trace entry, nothing skipped); `inspectRouting` (default: that inspection) and `folderExists` (default `true`) on `createFakeEditorUseCases`.

**Files:**
- Modify: `packages/app-workflows/src/editor/domain/types.ts`
- Create: `packages/app-workflows/src/editor/model/assignment/AssignmentStrategy.ts`
- Modify: `packages/app-workflows/src/editor/gateway/dto.ts`
- Modify: `packages/app-workflows/src/editor/gateway/editorFields.ts`
- Modify: `packages/app-workflows/src/editor/gateway/editorFields.test.ts`
- Create: `packages/app-workflows/src/editor/gateway/mapRoutingInspection.ts`
- Create: `packages/app-workflows/src/editor/gateway/mapRoutingInspection.test.ts`
- Modify: `packages/app-workflows/src/editor/gateway/IWorkflowEditorGateway.ts`
- Modify: `packages/app-workflows/src/editor/useCases/IWorkflowEditorUseCases.ts`
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.ts`
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts`
- Modify: `packages/app-workflows/src/editor/testing/editorFixtures.ts`
- Modify: `packages/app-workflows/src/editor/testing/fakeWorkflowEditorUseCases.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `EditorEnvelope<T>`, `EditorActorDto` (`~/editor/gateway/dto.js`), `toOperationError` (`~/editor/useCases/toOperationError.js`), `WorkflowEditorUseCases` (the plain class, `~/editor/useCases/WorkflowEditorUseCases.js`) and its per-app subclass test in `WorkflowEditorUseCases.test.ts`, `ERROR_FIELDS` (`~/review/gateway/reviewFields.js`), `createEditorWorkflowDto`, `EDITOR_SAVED_ON` (`editorFixtures.ts`). Server side (Task 4): the extended `WorkflowsRoutingInspection` of R289 and `WorkflowsBooleanResponse { data: Boolean error }`.
- Produces (matches the contract): `IWorkflowEditorUseCases.inspectRouting(params: InspectRoutingParams): Promise<RoutingInspection>`, `IWorkflowEditorUseCases.folderExists(params: FolderExistsParams): Promise<boolean>`, `RoutingInspection { owner: RoutingOwner | null; source: RoutingSource; ruleId: string | null; strategy: AssignmentStrategy; narrowedTeamId: string | null; candidateIds: string[]; candidateCount: number; trace: RoutingTraceEntry[]; skipped: RoutingSkippedPerson[] }`, `RoutingOwner { id: string; displayName: string }`, `RoutingTraceEntry { ruleId: string; outcome: RoutingTraceOutcome; reason: string | null; failedConditions: RoutingCondition[] }`, `RoutingSkippedPerson { userId: string; displayName: string | null; reason: string }`, `RoutingStepConfig { teams: string[]; assignment: Record<string, unknown> }`, `RoutingCondition`, `RoutingTraceOutcome`, `RoutingSource`, `InspectRoutingParams`, `FolderExistsParams`, `IWorkflowEditorGateway.inspectRouting` and `.folderExists`, `mapRoutingInspection`, `EDITOR_ROUTING_INSPECTION_FIELDS`, `AssignmentStrategy`, the fixtures and the fakes above. Consumed by Tasks 7b, 13, 14, 14b, 14c and 17. The Validation error data type of `app-workflows` is extended in Task 15, not here.

**Test runner note:** admin package, `yarn test <path>` only. After this task the CMS and WB gateway classes no longer satisfy `IWorkflowEditorGateway` until Task 7b adds their two methods; Task 7b is the next task and this task checks `app-workflows` only (the two app packages are built after Task 7b).

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/editor/testing/editorFixtures.ts`: the fixtures the tests below import.

Before:

```ts
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
```

After:

```ts
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
```

Before:

```ts
import type { EditorWorkflowDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "~/editor/gateway/dto.js";
```

After:

```ts
import type { EditorWorkflowDto } from "~/editor/gateway/dto.js";
import type { RoutingInspectionDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "~/editor/gateway/dto.js";
```

Before:

```ts
export const createAiModel = (overrides: Partial<AiModel> = {}): AiModel => {
```

After:

```ts
export const createRoutingInspectionDto = (
    overrides: Partial<RoutingInspectionDto> = {}
): RoutingInspectionDto => {
    return {
        owner: { id: "user-2", displayName: "Ivan Horvat" },
        source: "rule",
        ruleId: "rule-1",
        strategy: "none",
        narrowedTeamId: null,
        candidateIds: [],
        candidateCount: 0,
        trace: [{ ruleId: "rule-1", outcome: "matched", reason: null, failedConditions: [] }],
        skipped: [],
        ...overrides
    };
};

export const createRoutingInspection = (
    overrides: Partial<RoutingInspection> = {}
): RoutingInspection => {
    return {
        owner: { id: "user-2", displayName: "Ivan Horvat" },
        source: "rule",
        ruleId: "rule-1",
        strategy: "none",
        narrowedTeamId: null,
        candidateIds: [],
        candidateCount: 0,
        trace: [{ ruleId: "rule-1", outcome: "matched", reason: null, failedConditions: [] }],
        skipped: [],
        ...overrides
    };
};

export const createAiModel = (overrides: Partial<AiModel> = {}): AiModel => {
```

Create `packages/app-workflows/src/editor/gateway/mapRoutingInspection.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapRoutingInspection } from "./mapRoutingInspection.js";
import type { RoutingInspectionDto } from "./dto.js";
import { createRoutingInspection } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";

describe("mapRoutingInspection", () => {
    it("maps every field of a rule decision", () => {
        const dto = createRoutingInspectionDto({
            owner: { id: "user-2", displayName: "Ivan Horvat" },
            source: "rule",
            ruleId: "rule-2",
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["requesterTeam"]
                },
                { ruleId: "rule-2", outcome: "matched", reason: null, failedConditions: [] }
            ]
        });

        const result = mapRoutingInspection(dto);

        expect(result).toEqual(
            createRoutingInspection({
                owner: { id: "user-2", displayName: "Ivan Horvat" },
                source: "rule",
                ruleId: "rule-2",
                strategy: "none",
                trace: [
                    {
                        ruleId: "rule-1",
                        outcome: "notMatched",
                        reason: null,
                        failedConditions: ["requesterTeam"]
                    },
                    { ruleId: "rule-2", outcome: "matched", reason: null, failedConditions: [] }
                ]
            })
        );
    });

    it("maps every trace outcome, the failed conditions and the reasons", () => {
        const dto = createRoutingInspectionDto({
            trace: [
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["requesterUser", "folder"]
                },
                {
                    ruleId: "rule-2",
                    outcome: "skipped",
                    reason: "Excluded from reviews.",
                    failedConditions: []
                },
                { ruleId: "rule-3", outcome: "matched", reason: null, failedConditions: [] },
                { ruleId: "rule-4", outcome: "notEvaluated", reason: null, failedConditions: [] }
            ]
        });

        const trace = mapRoutingInspection(dto).trace;

        expect(trace.map(entry => entry.outcome)).toEqual([
            "notMatched",
            "skipped",
            "matched",
            "notEvaluated"
        ]);
        expect(trace[0].failedConditions).toEqual(["requesterUser", "folder"]);
        expect(trace[1].reason).toBe("Excluded from reviews.");
        expect(trace[3].reason).toBeNull();
    });

    it("keeps the order of the trace as the server returned it", () => {
        const dto = createRoutingInspectionDto({
            trace: [
                { ruleId: "rule-b", outcome: "matched", reason: null, failedConditions: [] },
                { ruleId: "rule-a", outcome: "notEvaluated", reason: null, failedConditions: [] }
            ]
        });

        const ids = mapRoutingInspection(dto).trace.map(entry => entry.ruleId);

        expect(ids).toEqual(["rule-b", "rule-a"]);
    });

    it("maps a pool decision without an owner", () => {
        const dto = createRoutingInspectionDto({
            owner: null,
            source: "pool",
            ruleId: null,
            trace: []
        });

        const result = mapRoutingInspection(dto);

        expect(result.owner).toBeNull();
        expect(result.source).toBe("pool");
        expect(result.ruleId).toBeNull();
        expect(result.trace).toEqual([]);
    });

    it("maps the narrowed team, the first candidate ids and the candidate count", () => {
        const dto = createRoutingInspectionDto({
            owner: { id: "user-3", displayName: "Maja Kos" },
            source: "roundRobin",
            ruleId: "rule-1",
            strategy: "roundRobin",
            narrowedTeamId: "team-2",
            candidateIds: ["user-3", "user-4", "user-5"],
            candidateCount: 7
        });

        const result = mapRoutingInspection(dto);

        expect(result.narrowedTeamId).toBe("team-2");
        expect(result.candidateIds).toEqual(["user-3", "user-4", "user-5"]);
        expect(result.candidateCount).toBe(7);
        expect(result.strategy).toBe("roundRobin");
        expect(result.source).toBe("roundRobin");
    });

    it("maps the skipped people, a null display name stays null", () => {
        const dto = createRoutingInspectionDto({
            skipped: [
                { userId: "user-6", displayName: "Luka Peric", reason: "Excluded from reviews." },
                { userId: "user-7", displayName: null, reason: "Can't read this content." }
            ]
        });

        expect(mapRoutingInspection(dto).skipped).toEqual([
            { userId: "user-6", displayName: "Luka Peric", reason: "Excluded from reviews." },
            { userId: "user-7", displayName: null, reason: "Can't read this content." }
        ]);
    });

    it("maps each configured strategy and an unknown string to none", () => {
        const roundRobinDto = createRoutingInspectionDto({ strategy: "roundRobin" });
        const leastLoadedDto = createRoutingInspectionDto({ strategy: "leastLoaded" });
        const noneDto = createRoutingInspectionDto({ strategy: "none" });
        const unknownDto = createRoutingInspectionDto({ strategy: "somethingNew" });

        const roundRobin = mapRoutingInspection(roundRobinDto);
        const leastLoaded = mapRoutingInspection(leastLoadedDto);
        const none = mapRoutingInspection(noneDto);
        const unknown = mapRoutingInspection(unknownDto);

        expect(roundRobin.strategy).toBe("roundRobin");
        expect(leastLoaded.strategy).toBe("leastLoaded");
        expect(none.strategy).toBe("none");
        expect(unknown.strategy).toBe("none");
    });

    it("maps absent optional fields to their empty values", () => {
        const dto = createRoutingInspectionDto();
        Reflect.deleteProperty(dto, "narrowedTeamId");
        Reflect.deleteProperty(dto, "candidateIds");
        Reflect.deleteProperty(dto, "candidateCount");
        const entry = dto.trace[0];
        Reflect.deleteProperty(entry, "failedConditions");
        Reflect.deleteProperty(entry, "reason");

        const result = mapRoutingInspection(dto);

        expect(result.narrowedTeamId).toBeNull();
        expect(result.candidateIds).toEqual([]);
        expect(result.candidateCount).toBe(0);
        expect(result.trace[0].failedConditions).toEqual([]);
        expect(result.trace[0].reason).toBeNull();
    });

    it("does not share its arrays with the DTO", () => {
        const dto: RoutingInspectionDto = createRoutingInspectionDto({
            candidateIds: ["user-3"],
            candidateCount: 1,
            trace: [
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ],
            skipped: [{ userId: "user-6", displayName: null, reason: "Excluded from reviews." }]
        });

        const result = mapRoutingInspection(dto);

        expect(result.candidateIds).not.toBe(dto.candidateIds);
        expect(result.trace).not.toBe(dto.trace);
        expect(result.trace[0].failedConditions).not.toBe(dto.trace[0].failedConditions);
        expect(result.skipped).not.toBe(dto.skipped);
    });
});
```

Modify `packages/app-workflows/src/editor/gateway/editorFields.test.ts`.

Before:

```ts
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "./editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "./editorFields.js";
```

After:

```ts
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "./editorFields.js";
import { EDITOR_ROUTING_INSPECTION_FIELDS } from "./editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "./editorFields.js";
```

Before (Task 6 already added `EDITOR_USER_LIST_FIELDS` after the team fragment):

```ts
            EDITOR_USER_LIST_FIELDS,
            EDITOR_AI_MODEL_FIELDS,
```

After:

```ts
            EDITOR_USER_LIST_FIELDS,
            EDITOR_ROUTING_INSPECTION_FIELDS,
            EDITOR_AI_MODEL_FIELDS,
```

Before:

```ts
    it("selects exactly id, name and memberCount of a team and the missing ids (R268)", () => {
```

After:

```ts
    it("selects every field of the routing inspection the composer reads (R289)", () => {
        const selection = words(EDITOR_ROUTING_INSPECTION_FIELDS);

        expect(selection).toContain("source");
        expect(selection).toContain("ruleId");
        expect(selection).toContain("strategy");
        expect(selection).toContain("narrowedTeamId");
        expect(selection).toContain("candidateIds");
        expect(selection).toContain("candidateCount");
        expect(EDITOR_ROUTING_INSPECTION_FIELDS).toMatch(/owner\s*\{\s*id\s+displayName\s*\}/);
        expect(EDITOR_ROUTING_INSPECTION_FIELDS).toMatch(
            /trace\s*\{\s*ruleId\s+outcome\s+reason\s+failedConditions\s*\}/
        );
        expect(EDITOR_ROUTING_INSPECTION_FIELDS).toMatch(
            /skipped\s*\{\s*userId\s+displayName\s+reason\s*\}/
        );
        expect(selection).not.toContain("email");
    });

    it("selects exactly id, name and memberCount of a team and the missing ids (R268)", () => {
```

Modify `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts`.

Before:

```ts
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { FolderExistsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
```

Before:

```ts
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
```

After:

```ts
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspection } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
```

Before:

```ts
        storeWorkflow: vi.fn(),
        deleteWorkflow: vi.fn()
    };
};

const listParams
```

After:

```ts
        storeWorkflow: vi.fn(),
        deleteWorkflow: vi.fn(),
        inspectRouting: vi.fn(),
        folderExists: vi.fn()
    };
};

const inspectParams: InspectRoutingParams = {
    stepConfig: {
        teams: ["team-1"],
        assignment: { strategy: "none", allowManualPick: false, rules: [] }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "article"
};

const folderParams: FolderExistsParams = { id: "folder-1", type: "cms:article" };

const listParams
```

Before:

```ts
    {
        name: "deleteWorkflow",
        method: "deleteWorkflow",
        run: useCases => useCases.deleteWorkflow("workflow-1")
    }
];
```

After:

```ts
    {
        name: "deleteWorkflow",
        method: "deleteWorkflow",
        run: useCases => useCases.deleteWorkflow("workflow-1")
    },
    {
        name: "inspectRouting",
        method: "inspectRouting",
        run: useCases => useCases.inspectRouting(inspectParams)
    },
    {
        name: "folderExists",
        method: "folderExists",
        run: useCases => useCases.folderExists(folderParams)
    }
];
```

Before:

```ts
    describe("error mapping (R204)", () => {
```

After:

```ts
    describe("inspectRouting", () => {
        it("passes the params untouched and maps the inspection", async () => {
            gateway.inspectRouting.mockResolvedValue({
                data: createRoutingInspectionDto({
                    narrowedTeamId: "team-2",
                    candidateIds: ["user-3", "user-4"],
                    candidateCount: 5,
                    trace: [
                        {
                            ruleId: "rule-1",
                            outcome: "notMatched",
                            reason: null,
                            failedConditions: ["folder"]
                        },
                        {
                            ruleId: "rule-2",
                            outcome: "notEvaluated",
                            reason: null,
                            failedConditions: []
                        }
                    ]
                }),
                error: null
            });

            const inspection = await useCases.inspectRouting(inspectParams);

            expect(gateway.inspectRouting).toHaveBeenCalledWith(inspectParams);
            const sent: InspectRoutingParams = gateway.inspectRouting.mock.calls[0][0];
            expect(sent).toBe(inspectParams);
            expect(inspection).toEqual(
                createRoutingInspection({
                    narrowedTeamId: "team-2",
                    candidateIds: ["user-3", "user-4"],
                    candidateCount: 5,
                    trace: [
                        {
                            ruleId: "rule-1",
                            outcome: "notMatched",
                            reason: null,
                            failedConditions: ["folder"]
                        },
                        {
                            ruleId: "rule-2",
                            outcome: "notEvaluated",
                            reason: null,
                            failedConditions: []
                        }
                    ]
                })
            );
        });

        it("throws a validation error that keeps the rule, the step and the field", async () => {
            const data = {
                stepId: "step-1",
                field: "config.assignment.rules.target",
                ruleId: "rule-1",
                workflowId: null
            };
            gateway.inspectRouting.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.Validation,
                    message: "The target team is not one of the step's reviewing teams.",
                    data
                }
            });

            const promise = useCases.inspectRouting(inspectParams);

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Validation,
                message: "The target team is not one of the step's reviewing teams.",
                data
            });
        });
    });

    describe("folderExists", () => {
        it("passes the params untouched and answers true for a folder that exists", async () => {
            gateway.folderExists.mockResolvedValue({ data: true, error: null });

            const exists = await useCases.folderExists(folderParams);

            expect(gateway.folderExists).toHaveBeenCalledWith(folderParams);
            expect(exists).toBe(true);
        });

        it("answers false for a deleted folder and does not throw", async () => {
            gateway.folderExists.mockResolvedValue({ data: false, error: null });

            const exists = await useCases.folderExists(folderParams);

            expect(exists).toBe(false);
        });
    });

    describe("error mapping (R204)", () => {
```

Before:

```ts
        it("the shared class carries no abstraction metadata, so it cannot be registered as is (R237)", () => {
```

After:

```ts
        it("runs inspectRouting and folderExists of each subclass through its own gateway", async () => {
            const gatewayA = createFakeGateway();
            const gatewayB = createFakeGateway();
            gatewayA.inspectRouting.mockResolvedValue({
                data: createRoutingInspectionDto({ ruleId: "rule-a" }),
                error: null
            });
            gatewayB.inspectRouting.mockResolvedValue({
                data: createRoutingInspectionDto({ ruleId: "rule-b" }),
                error: null
            });
            gatewayA.folderExists.mockResolvedValue({ data: true, error: null });
            gatewayB.folderExists.mockResolvedValue({ data: false, error: null });
            const container = new Container();
            container.registerInstance(GatewayA, gatewayA);
            container.registerInstance(GatewayB, gatewayB);
            container.register(BoundA).inSingletonScope();
            container.register(BoundB).inSingletonScope();

            const a = container.resolve(UseCasesA);
            const b = container.resolve(UseCasesB);
            const inspectionA = await a.inspectRouting(inspectParams);
            const inspectionB = await b.inspectRouting(inspectParams);
            const existsA = await a.folderExists(folderParams);
            const existsB = await b.folderExists(folderParams);

            expect(inspectionA.ruleId).toBe("rule-a");
            expect(inspectionB.ruleId).toBe("rule-b");
            expect(existsA).toBe(true);
            expect(existsB).toBe(false);
            expect(gatewayA.inspectRouting).toHaveBeenCalledTimes(1);
            expect(gatewayB.inspectRouting).toHaveBeenCalledTimes(1);
            expect(gatewayA.folderExists).toHaveBeenCalledTimes(1);
            expect(gatewayB.folderExists).toHaveBeenCalledTimes(1);
        });

        it("the shared class carries no abstraction metadata, so it cannot be registered as is (R237)", () => {
```

- [ ] **Step 2: Run the new tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/gateway/mapRoutingInspection.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/gateway/editorFields.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts 2>&1 | tail -40
```

Expected: FAIL. The mapper test cannot resolve `./mapRoutingInspection.js`; `editorFields.test.ts` fails on `EDITOR_ROUTING_INSPECTION_FIELDS` being `undefined`; the use-case test fails with `useCases.inspectRouting is not a function` and `useCases.folderExists is not a function`.

- [ ] **Step 3: Implementation**

Create `packages/app-workflows/src/editor/model/assignment/AssignmentStrategy.ts`:

```ts
// The stored `assignment.strategy` of a People step (R297); Task 9 reads and writes it.
export type AssignmentStrategy = "none" | "roundRobin" | "leastLoaded";
```

Modify `packages/app-workflows/src/editor/domain/types.ts`.

Before (top of the file):

```ts
export interface EditorActor {
```

After:

```ts
import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";

export interface EditorActor {
```

Before:

```ts
export interface WorkflowModelPage {
    rows: WorkflowModelRow[];
    cursor: string | null;
    hasMoreItems: boolean;
}
```

After:

```ts
export interface WorkflowModelPage {
    rows: WorkflowModelRow[];
    cursor: string | null;
    hasMoreItems: boolean;
}

// The conditions of a rule the editor can show; a failed `modelId` condition names none (R289).
export type RoutingCondition = "requesterUser" | "requesterTeam" | "folder";

// `notEvaluated`: a rule after the deciding one, never looked at (R289).
export type RoutingTraceOutcome = "matched" | "notMatched" | "skipped" | "notEvaluated";

export type RoutingSource = "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool";

export interface RoutingTraceEntry {
    ruleId: string;
    outcome: RoutingTraceOutcome;
    // The server's skip reason for `skipped`, as it is; `null` otherwise or when it has none.
    reason: string | null;
    // Non-empty only for `notMatched`, in the order the server evaluated them.
    failedConditions: RoutingCondition[];
}

// A person routing skipped (D118). `displayName` is `null` outside the step's teams.
export interface RoutingSkippedPerson {
    userId: string;
    displayName: string | null;
    reason: string;
}

export interface RoutingOwner {
    id: string;
    displayName: string;
}

// What routing would do with an unsaved step config (R121, D45, D118). No load numbers (D104).
export interface RoutingInspection {
    owner: RoutingOwner | null;
    source: RoutingSource;
    ruleId: string | null;
    // The step's configured strategy.
    strategy: AssignmentStrategy;
    // The team a matched team-target rule narrowed to, else `null`.
    narrowedTeamId: string | null;
    // The first candidate ids in the order the strategy considers them (at most three).
    candidateIds: string[];
    // All candidates, so the editor can say `and others`.
    candidateCount: number;
    // Every rule in order.
    trace: RoutingTraceEntry[];
    skipped: RoutingSkippedPerson[];
}

// The step config the inspector evaluates: exactly what `toStepInput` emits for a People step.
export interface RoutingStepConfig {
    teams: string[];
    assignment: Record<string, unknown>;
}
```

Modify `packages/app-workflows/src/editor/gateway/dto.ts`.

Before:

```ts
/*
 * The response of one operation under the shared `workflows` root: the root field name maps to the
```

After:

```ts
export type RoutingConditionDto = "requesterUser" | "requesterTeam" | "folder";

export type RoutingTraceOutcomeDto = "matched" | "notMatched" | "skipped" | "notEvaluated";

export type RoutingSourceDto = "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool";

export interface RoutingTraceEntryDto {
    ruleId: string;
    outcome: RoutingTraceOutcomeDto;
    reason: string | null;
    failedConditions: RoutingConditionDto[];
}

export interface RoutingSkippedPersonDto {
    userId: string;
    displayName: string | null;
    reason: string;
}

export interface RoutingInspectionDto {
    owner: EditorActorDto | null;
    source: RoutingSourceDto;
    ruleId: string | null;
    // `String!` in the schema; the mapper narrows it to the three strategies.
    strategy: string;
    narrowedTeamId: string | null;
    candidateIds: string[];
    candidateCount: number;
    trace: RoutingTraceEntryDto[];
    skipped: RoutingSkippedPersonDto[];
}

/*
 * The response of one operation under the shared `workflows` root: the root field name maps to the
```

Modify `packages/app-workflows/src/editor/gateway/editorFields.ts`.

Before:

```ts
export const EDITOR_AI_MODEL_FIELDS = /* GraphQL */ `
```

After:

```ts
// The `WorkflowsRoutingInspection` selection (R289), shared by both apps' inspectRouting documents.
export const EDITOR_ROUTING_INSPECTION_FIELDS = /* GraphQL */ `
    owner {
        id
        displayName
    }
    source
    ruleId
    strategy
    narrowedTeamId
    candidateIds
    candidateCount
    trace {
        ruleId
        outcome
        reason
        failedConditions
    }
    skipped {
        userId
        displayName
        reason
    }
`;

export const EDITOR_AI_MODEL_FIELDS = /* GraphQL */ `
```

Create `packages/app-workflows/src/editor/gateway/mapRoutingInspection.ts`:

```ts
import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RoutingOwner } from "~/editor/domain/types.js";
import type { RoutingSkippedPerson } from "~/editor/domain/types.js";
import type { RoutingTraceEntry } from "~/editor/domain/types.js";
import type { RoutingInspectionDto } from "./dto.js";
import type { RoutingSkippedPersonDto } from "./dto.js";
import type { RoutingTraceEntryDto } from "./dto.js";

const toAssignmentStrategy = (strategy: string): AssignmentStrategy => {
    if (strategy === "roundRobin") {
        return "roundRobin";
    }
    if (strategy === "leastLoaded") {
        return "leastLoaded";
    }
    return "none";
};

const mapTraceEntry = (dto: RoutingTraceEntryDto): RoutingTraceEntry => {
    return {
        ruleId: dto.ruleId,
        outcome: dto.outcome,
        reason: dto.reason ?? null,
        failedConditions: [...(dto.failedConditions ?? [])]
    };
};

const mapSkippedPerson = (dto: RoutingSkippedPersonDto): RoutingSkippedPerson => {
    return {
        userId: dto.userId,
        displayName: dto.displayName ?? null,
        reason: dto.reason
    };
};

export const mapRoutingInspection = (dto: RoutingInspectionDto): RoutingInspection => {
    const owner: RoutingOwner | null = dto.owner
        ? { id: dto.owner.id, displayName: dto.owner.displayName }
        : null;

    return {
        owner,
        source: dto.source,
        ruleId: dto.ruleId ?? null,
        strategy: toAssignmentStrategy(dto.strategy),
        narrowedTeamId: dto.narrowedTeamId ?? null,
        candidateIds: [...(dto.candidateIds ?? [])],
        candidateCount: dto.candidateCount ?? 0,
        trace: dto.trace.map(mapTraceEntry),
        skipped: dto.skipped.map(mapSkippedPerson)
    };
};
```

Modify `packages/app-workflows/src/editor/gateway/IWorkflowEditorGateway.ts`.

Before:

```ts
import type { EditorEnvelope } from "./dto.js";
import type { EditorWorkflowDto } from "./dto.js";
import type { WorkflowModelPageDto } from "./dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
```

After:

```ts
import type { EditorEnvelope } from "./dto.js";
import type { EditorWorkflowDto } from "./dto.js";
import type { RoutingInspectionDto } from "./dto.js";
import type { WorkflowModelPageDto } from "./dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import type { RoutingStepConfig } from "~/editor/domain/types.js";
```

Before:

```ts
/*
 * The workflow operations one app exposes over its own GraphQL documents (R202).
```

After:

```ts
export interface InspectRoutingParams {
    // `{ teams, assignment }` exactly as `toStepInput` emits it for the draft step (R300).
    stepConfig: RoutingStepConfig;
    requesterId: string;
    // `null` is the root. The CMS sends it as an omitted folder, the WB too.
    folderId: string | null;
    // The bare model id (R300); the CMS sends it, the WB ignores it.
    modelId: string | null;
}

export interface FolderExistsParams {
    id: string;
    // The rule folder's own `type` (R292); the WB ignores it (its type is always `wb:page`).
    type: string;
}

/*
 * The workflow operations one app exposes over its own GraphQL documents (R202).
```

Before:

```ts
    deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
}
```

After:

```ts
    deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
    inspectRouting(params: InspectRoutingParams): Promise<EditorEnvelope<RoutingInspectionDto>>;
    folderExists(params: FolderExistsParams): Promise<EditorEnvelope<boolean>>;
}
```

Modify `packages/app-workflows/src/editor/useCases/IWorkflowEditorUseCases.ts`.

Before:

```ts
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
```

After:

```ts
import type { FolderExistsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
```

Before:

```ts
    // Resolves with the deleted workflow.
    deleteWorkflow(id: string): Promise<EditorWorkflow>;
}
```

After:

```ts
    // Resolves with the deleted workflow.
    deleteWorkflow(id: string): Promise<EditorWorkflow>;
    // What routing would do with the unsaved step config; the editor composes the sentences (R301).
    inspectRouting(params: InspectRoutingParams): Promise<RoutingInspection>;
    // `false` is an answer (the folder was deleted), not an error.
    folderExists(params: FolderExistsParams): Promise<boolean>;
}
```

Modify `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.ts`.

Before:

```ts
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { IWorkflowEditorUseCases } from "./IWorkflowEditorUseCases.js";
import { mapEditorWorkflow } from "~/editor/gateway/mapEditorWorkflow.js";
import { mapWorkflowModelPage } from "~/editor/gateway/mapWorkflowModelPage.js";
```

After:

```ts
import type { FolderExistsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { IWorkflowEditorUseCases } from "./IWorkflowEditorUseCases.js";
import { mapEditorWorkflow } from "~/editor/gateway/mapEditorWorkflow.js";
import { mapRoutingInspection } from "~/editor/gateway/mapRoutingInspection.js";
import { mapWorkflowModelPage } from "~/editor/gateway/mapWorkflowModelPage.js";
```

Before:

```ts
    public async deleteWorkflow(id: string): Promise<EditorWorkflow> {
        const envelope = await this.gateway.deleteWorkflow(id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapEditorWorkflow(envelope.data);
    }
```

After:

```ts
    public async deleteWorkflow(id: string): Promise<EditorWorkflow> {
        const envelope = await this.gateway.deleteWorkflow(id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapEditorWorkflow(envelope.data);
    }

    public async inspectRouting(params: InspectRoutingParams): Promise<RoutingInspection> {
        const envelope = await this.gateway.inspectRouting(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapRoutingInspection(envelope.data);
    }

    public async folderExists(params: FolderExistsParams): Promise<boolean> {
        const envelope = await this.gateway.folderExists(params);
        // `false` is a valid answer, so only `null` (no answer at all) is an error.
        if (envelope.error || envelope.data === null) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }
```

Modify `packages/app-workflows/src/editor/testing/fakeWorkflowEditorUseCases.ts`.

Before:

```ts
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
```

After:

```ts
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspection } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
```

Before:

```ts
    deleteWorkflow: Mock<IWorkflowEditorUseCases["deleteWorkflow"]>;
}
```

After:

```ts
    deleteWorkflow: Mock<IWorkflowEditorUseCases["deleteWorkflow"]>;
    inspectRouting: Mock<IWorkflowEditorUseCases["inspectRouting"]>;
    folderExists: Mock<IWorkflowEditorUseCases["folderExists"]>;
}
```

Before:

```ts
 * read, store and delete resolves the default workflow. Tests override single methods with
 * `mockResolvedValue` or `mockRejectedValue`.
```

After:

```ts
 * read, store and delete resolves the default workflow, `inspectRouting` resolves a rule decision
 * and `folderExists` resolves `true`. Tests override single methods with `mockResolvedValue` or
 * `mockRejectedValue`.
```

Before:

```ts
        deleteWorkflow: vi.fn().mockResolvedValue(workflow)
    };
```

After:

```ts
        deleteWorkflow: vi.fn().mockResolvedValue(workflow),
        inspectRouting: vi.fn().mockResolvedValue(createRoutingInspection()),
        folderExists: vi.fn().mockResolvedValue(true)
    };
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/gateway/mapRoutingInspection.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/gateway/editorFields.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts 2>&1 | tail -40
```

Expected: PASS. The `it.each(operationCases)` error-mapping cases now include `inspectRouting` and `folderExists` (envelope error, neither data nor error, transport failure).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/gateway packages/app-workflows/src/editor/useCases 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors in `app-workflows`. `yarn build -p @webiny/app-headless-cms-workflows` and `-p @webiny/app-website-builder-workflows` fail at this point on the gateway classes that lack the two new methods; Task 7b makes them pass and is the next task, so do not run them here.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
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
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the routing inspection types, mapper and use-case methods" -m "The per-app editor gateway and use cases get inspectRouting and folderExists. The shared mapper turns the inspection DTO, with failed conditions, the narrowed team and the candidate ids, into the domain type the Test routing composer reads. folderExists treats false as an answer." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`AssignmentStrategy` is created by this task, not Task 9.** The contract's `RoutingInspection.strategy: AssignmentStrategy` needs the type before Task 9 (`[AWE]/model/assignment/AssignmentStrategy.ts`, listed under Task 9). The file is created here with the exact contract definition (`"none" | "roundRobin" | "leastLoaded"`); Task 9 must not create it again and just imports it (verify: Task 9's file list and its step 3). `domain/types.ts` imports it from `model/`, a small layering exception the contract's type signature forces.
- **`editorFields.ts` and its test are also touched** (`EDITOR_ROUTING_INSPECTION_FIELDS`, new, not in the contract's file list): one shared selection keeps the CMS and WB documents of Task 7b from duplicating it.
- **DTO names** (`RoutingInspectionDto` and the others) are not fixed by the contract. `RoutingInspectionDto.strategy` is a plain `string` because the schema field is `String!`; the mapper narrows it.
- **`folderExists` uses `data === null`** (not `!data`) because `false` is the "deleted folder" answer; the use-case table test covers `null` and the dedicated test covers `false`.
- **Per-app builds after this task:** the CMS and WB gateway classes fail type-check until Task 7b; this task verifies `app-workflows` only.
- Size: medium.

## Review fixes (sub-phase review)

- The `editorFields.test.ts` "keeps every selection balanced" hunk now anchors on `EDITOR_USER_LIST_FIELDS` (Task 6 runs first and inserts it between the team and AI model fragments, so the old Before text no longer matched).
- The strategy mapper test and the first mapper test named their intermediate values instead of nesting calls as arguments.
- Checked against 9b.2 Task 4's SDL: every selected field (`owner { id displayName }`, `source`, `ruleId`, `strategy`, `narrowedTeamId`, `candidateIds`, `candidateCount`, `trace { ruleId outcome reason failedConditions }`, `skipped { userId displayName reason }`) and the outcome and condition unions match; `WorkflowsBooleanResponse` matches the `folderExists` envelope.
