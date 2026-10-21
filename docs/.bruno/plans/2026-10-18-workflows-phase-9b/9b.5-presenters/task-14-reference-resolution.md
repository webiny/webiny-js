### Task 14: Editor presenter: saved-reference resolution

R285, R290, R292, R298, R309; D117, D173, D176; Q54, Q58, Q59.1; Review Focus 4 and 5; Copy gap 8. The editor presenter resolves every user, team and folder id a People step's rules hold, so a saved reference never renders empty. It collects the distinct ids of the open workflow's rules (`requesterUserId` and user targets; `requesterTeamId` and team targets; folders as `{ id, type }`), resolves users with `listUsers({ ids })` in chunks of 200, rule teams with `listTeams({ ids })` in chunks of 200, and folders from the adapter's folder list and then `folderExists` once per distinct unlisted id. The answers become `RuleReferences` (R298 labels: found shows the name or path, a missing user is `Deleted user`, a missing team `Deleted team`, an unlisted existing folder `Restricted folder`, an unlisted missing folder `Deleted folder`). The presenter owns this (R234); the drawer reads it through `StepDrawerSource.getReferences()`.

- **When it runs:** after a workflow loads or reloads (after the 9a `resolveTeams`), after every `updateStep` (the drawer's Done is the only way a step's references change), and after a successful save (the maps are pruned to the saved ids first, then the missing ones are resolved). `retryReferences()` and the banner's Try again (`retryOptions`) resolve only the ids that are still unresolved: a resolved id is in a map, a failed one is not.
- **Status for the pickers:** `getReferencesStatus(): ReferencesStatus { loading: boolean; failed: boolean }` (presenter, `StepDrawerSource`, fake) says whether a resolution run is in flight and whether the last one left ids unresolved (a lookup or the folder list failed). Task 16 puts it into the `references` slice (`loading`, `failed`) so a picker shows its neutral label while ids are unresolved (Task 19b).
- **Run token:** every run that has something to ask starts a new `referencesToken`; a response of an older run (workflow switch, dispose, a newer edit) is dropped. A reference removed from every step is not asked again, because the ids are collected from the current draft when a run starts. Concurrent chunks merge: one failed chunk leaves its ids unresolved and does not lose the others. Picked values are known locally and never re-resolved: team search results join the maps as found entries, and Task 14b does the same for user search results.
- **Folders:** the folder list is loaded once per model through `app.listFolders(modelId)` (the selected row's bare `modelId`, R292), only for a workflow that has a People step and when a People step is added; the same in-flight load is shared by the resolution. A failed list load shows the R281 banner (`Could not load the step options.`, copy gap 8) and `retryOptions` loads it again. Task 14b exposes the loaded list to the picker.
- **Automation `user` settings (R271, R285, Task 19b's hint):** the saved ids of the `ui: "user"` settings of an Automation step join the user ids (the keys come from the step's definition, the mirror of 9a's `collectTeamIds` for `ui: "team"` settings), so a saved user of an Automation setting never renders empty. Automation steps do not depend on teams, so they are resolved while teams are off too. `getUserSettingKeys(schema)` (the mirror of `getTeamSettingKeys`) is created here; Task 19b's `UserPickerRenderer` and Task 16's first user search use it.
- **Teams off (R290):** when the `review` row of `listStepTypes` is not available, no People step is resolved: no `listTeams` call for its teams, no `listUsers`, no folder list, no `folderExists`. `isReviewAvailable(stepTypes)` is true unless the `review` row exists and is not available (a missing row, for example a failed step type list, is not "unavailable"), and `isStepReadOnly` returns true for a People step exactly when the row is not available (R309; Task 16 owns the drawer side).
- **No wrapper helpers:** every use-case call (`listUsers`, `listTeams`, `folderExists`, `listFolders`) is inline in the presenter. The new files are pure: `collectRuleReferenceIds` (what to ask, rule references and Automation user settings), `findUnresolvedReferenceIds`, `chunkIds`, `partitionSettled`, `resolveRuleReferences` (answers into labels), `addFoundUsers`, `addFoundTeams`, `pruneRuleReferences`.

**Files:**
- Create: `packages/app-workflows/src/editor/model/getUserSettingKeys.ts`
- Create: `packages/app-workflows/src/editor/model/getUserSettingKeys.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/RuleReferenceIds.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/collectRuleReferenceIds.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/findUnresolvedReferenceIds.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/chunkIds.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/partitionSettled.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/addFoundUsers.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/addFoundTeams.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/pruneRuleReferences.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/resolveRuleReferences.ts`
- Create: `packages/app-workflows/src/editor/testing/routingStepFixtures.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/referencesPure.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts`
- Modify: `packages/app-workflows/src/editor/model/isStepReadOnly.ts`
- Modify: `packages/app-workflows/src/editor/model/isStepReadOnly.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/constants.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/testing/fakeStepDrawerSource.ts`

**Interfaces:**
- Consumes: Task 6 (`WorkflowUserSummary`, `WorkflowUserList` in `~/editor/domain/types.js`, `IWorkflowConfigUseCases.listUsers`, the `listUsers` mock of `createFakeConfigUseCases`), Task 7 (`IWorkflowEditorUseCases.folderExists(params: FolderExistsParams): Promise<boolean>` with `FolderExistsParams { id: string; type: string }`, the `folderExists` mock of `createFakeEditorUseCases`), Task 8 (`AppFolder { id: string; path: string }` and `WorkflowEditorAppAdapter.listFolders(modelId: string | null): Promise<AppFolder[]>` in `~/editor/WorkflowEditorAppAdapter.js`, the `listFolders` mock of `createFakeAppAdapter`), Task 9 (`readAssignment(assignment: Record<string, unknown> | null): AssignmentValue`, `RuleValue` with `requesterUserId`, `requesterTeamId`, `folder: RuleFolderValue | null`, `target: RuleTargetValue | null`), Task 11 (`ReferenceLabel { id; label; state }`, `RuleReferences { users; teams; folders; userTeamIds }`, `createEmptyRuleReferences` in `model/rules/`, `getReferenceLabel`, the fixtures `createRuleReferences` and `createReferenceLabel` in `[AWET]/ruleFixtures.ts`), Task 12 (`isReviewAvailable` in `model/isReviewAvailable.ts`, `StepContext.references`, `StepContext.reviewAvailable`, `ValidateWorkflowDraftParams.references`, `ValidateWorkflowDraftParams.reviewAvailable`; the presenter already passes `createEmptyRuleReferences()` and `isReviewAvailable(this.stepTypes.items)` in `save` and `getStepContext`), 9a (`WorkflowEditorPresenter`, `resolveTeams`, `teamsKnown`, `buildOptionsBanner`, `retryOptions`, `createEditorPresenterSetup`, `createReviewStep`, `createStepTypes`, `createEditorWorkflow`, `createWorkflowTeamSummary`, `createDeferred`, `readReviewConfig`, `StepTypeId`).
- Produces: `IWorkflowEditorPresenter.getReferences(): RuleReferences`, `IWorkflowEditorPresenter.retryReferences(): void` and `getReferencesStatus(): ReferencesStatus` (also on `StepDrawerSource` and `FakeStepDrawerSource`; `ReferencesStatus { loading: boolean; failed: boolean }` in `[STEP]/editor/abstractions.ts`), `isStepReadOnly` true for a People step of an unavailable `review` row, the pure files above (Task 14b and 14c reuse `addFoundUsers`, `addFoundTeams`, `chunkIds`, `partitionSettled`), the folder state `folders`, `foldersLoading`, `foldersFailed` and the shared `loadFolders()` that Task 14b exposes, the fixtures `createStoredRule`, `createRoutingStep`, `createListedUser` that Tasks 14b, 14c, 15, 16 and 17 import.

**Test runner note:** admin package, `yarn test <path>` only. Type check: `yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30` (8a R243). The test fixtures live in `src/editor/testing/` (R243), pure builders without vitest imports.

- [ ] **Step 0: Preconditions**

Tasks 6, 7, 8, 9, 11 and 12 are committed. Check the names this task imports, and stop if one is missing:

```bash
cd /Users/brunozoric/work/webiny/webiny-js
grep -n "listUsers" packages/app-workflows/src/editor/testing/fakeWorkflowConfigUseCases.ts
grep -n "folderExists" packages/app-workflows/src/editor/testing/fakeWorkflowEditorUseCases.ts
grep -n "listFolders" packages/app-workflows/src/editor/testing/fakeEditorAppAdapter.ts packages/app-workflows/src/editor/WorkflowEditorAppAdapter.ts
grep -n "export" packages/app-workflows/src/editor/model/rules/ReferenceLabel.ts packages/app-workflows/src/editor/model/rules/RuleReferences.ts
grep -n "export" packages/app-workflows/src/editor/model/assignment/readAssignment.ts packages/app-workflows/src/editor/model/assignment/RuleValue.ts
grep -n "references\|reviewAvailable" packages/app-workflows/src/editor/model/StepContext.ts packages/app-workflows/src/editor/model/validateWorkflowDraft.ts
grep -n "export" packages/app-workflows/src/editor/model/isReviewAvailable.ts packages/app-workflows/src/editor/model/rules/createEmptyRuleReferences.ts packages/app-workflows/src/editor/model/rules/getReferenceLabel.ts
grep -n "export const createRuleReferences\|export const createReferenceLabel" packages/app-workflows/src/editor/testing/ruleFixtures.ts
```

Each fake must expose a vitest `Mock` named as above (`config.listUsers`, `useCases.folderExists`, `app.listFolders`). If Task 6, 7 or 8 named one differently, use its name in the tests below and record it under "Contract notes". `ReferenceState` is expected in `ReferenceLabel.ts` next to `ReferenceLabel`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/routingStepFixtures.ts` (pure builders, no vitest import; Tasks 14b to 17 import them):

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";

export interface StoredFolder {
    id: string;
    type: string;
    includeDescendants: boolean;
}

export interface StoredTarget {
    type: string;
    id: string;
}

export interface StoredRuleOptions {
    id: string;
    requesterUserId?: string;
    requesterTeamId?: string;
    folder?: StoredFolder;
    // `null` leaves the rule without a target; the default is the team `team-1`.
    target?: StoredTarget | null;
}

// A rule exactly as the server stores it: `{ id, conditions, target }`.
export const createStoredRule = (options: StoredRuleOptions): Record<string, unknown> => {
    const conditions: Record<string, unknown> = {};
    if (options.requesterUserId !== undefined) {
        conditions.requesterUserId = options.requesterUserId;
    }
    if (options.requesterTeamId !== undefined) {
        conditions.requesterTeamId = options.requesterTeamId;
    }
    if (options.folder !== undefined) {
        conditions.folder = options.folder;
    }

    const rule: Record<string, unknown> = { id: options.id, conditions };
    if (options.target === undefined) {
        rule.target = { type: "team", id: "team-1" };
    }
    if (options.target !== undefined && options.target !== null) {
        rule.target = options.target;
    }
    return rule;
};

// A People step (`step-1` unless named) with the strategy `none`, the toggle off and these rules.
export const createRoutingStep = (
    rules: Record<string, unknown>[],
    teams: string[] = ["team-1"],
    id = "step-1"
): EditorStep => {
    return createReviewStep({
        id,
        config: {
            teams,
            assignment: { strategy: "none", allowManualPick: false, rules }
        }
    });
};

export const createListedUser = (
    id: string,
    displayName: string,
    teamIds: string[] = ["team-1"]
): WorkflowUserSummary => {
    return { id, displayName, teamIds };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/referencesPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";
import { createEmptyRuleReferences } from "~/editor/model/rules/createEmptyRuleReferences.js";
import { addFoundTeams } from "./addFoundTeams.js";
import { addFoundUsers } from "./addFoundUsers.js";
import { chunkIds } from "./chunkIds.js";
import { collectRuleReferenceIds } from "./collectRuleReferenceIds.js";
import { findUnresolvedReferenceIds } from "./findUnresolvedReferenceIds.js";
import { partitionSettled } from "./partitionSettled.js";
import { pruneRuleReferences } from "./pruneRuleReferences.js";
import { resolveRuleReferences } from "./resolveRuleReferences.js";

const FOLDER = { id: "f1", type: "cms:article", includeDescendants: false };

describe("collectRuleReferenceIds (R298)", () => {
    it("collects the distinct users, teams and folders of every People step in rule order", () => {
        const first = createRoutingStep([
            createStoredRule({
                id: "r1",
                requesterUserId: "user-1",
                requesterTeamId: "team-8",
                folder: FOLDER,
                target: { type: "user", id: "user-2" }
            }),
            createStoredRule({
                id: "r2",
                requesterUserId: "user-1",
                folder: FOLDER,
                target: { type: "team", id: "team-9" }
            })
        ]);
        const second = createRoutingStep(
            [
                createStoredRule({
                    id: "r3",
                    folder: { id: "f2", type: "wb:page", includeDescendants: true },
                    target: { type: "user", id: "user-3" }
                })
            ],
            ["team-1"],
            "step-9"
        );

        const ids = collectRuleReferenceIds([first, second], true, []);

        expect(ids.userIds).toEqual(["user-1", "user-2", "user-3"]);
        expect(ids.teamIds).toEqual(["team-8", "team-9"]);
        expect(ids.folders).toEqual([
            { id: "f1", type: "cms:article" },
            { id: "f2", type: "wb:page" }
        ]);
    });

    it("ignores steps that are not People steps and rules without conditions or target", () => {
        const people = createRoutingStep([createStoredRule({ id: "r1", target: null })]);

        const ids = collectRuleReferenceIds([people, createAiStep()], true, []);

        expect(ids).toEqual({ userIds: [], teamIds: [], folders: [] });
    });

    it("collects the users of the ui user settings of Automation steps, also while teams are off", () => {
        const definition = createWebhookAutomation({
            settingsSchema: {
                type: "object",
                properties: {
                    owner: { type: "string", ui: "user" },
                    url: { type: "string" }
                }
            }
        });
        const step = createAutomationStep({
            config: {
                automationId: "send-webhook",
                settings: { owner: "user-5", url: "https://example.com/hook" }
            }
        });
        const other = createAutomationStep({
            id: "step-8",
            config: { automationId: "gone", settings: { owner: "user-6" } }
        });

        const on = collectRuleReferenceIds([step, other], true, [definition]);
        const off = collectRuleReferenceIds([step], false, [definition]);

        expect(on).toEqual({ userIds: ["user-5"], teamIds: [], folders: [] });
        expect(off.userIds).toEqual(["user-5"]);
    });

    it("collects nothing while the review step type is unavailable (teams off, R290)", () => {
        const people = createRoutingStep([
            createStoredRule({ id: "r1", requesterUserId: "user-1", folder: FOLDER })
        ]);

        expect(collectRuleReferenceIds([people], false, [])).toEqual({
            userIds: [],
            teamIds: [],
            folders: []
        });
    });
});

describe("findUnresolvedReferenceIds", () => {
    it("keeps only the ids no map holds", () => {
        const references = createRuleReferences({
            users: [{ id: "user-1", label: "Ada", state: "found" }],
            teams: [{ id: "team-9", label: "Deleted team", state: "deleted" }],
            folders: [{ id: "f1", label: "/News", state: "found" }]
        });

        const missing = findUnresolvedReferenceIds(
            {
                userIds: ["user-1", "user-2"],
                teamIds: ["team-9", "team-8"],
                folders: [
                    { id: "f1", type: "cms:article" },
                    { id: "f2", type: "cms:article" }
                ]
            },
            references
        );

        expect(missing).toEqual({
            userIds: ["user-2"],
            teamIds: ["team-8"],
            folders: [{ id: "f2", type: "cms:article" }]
        });
    });
});

describe("chunkIds", () => {
    it("splits a list into chunks of at most the size, in order", () => {
        expect(chunkIds([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
        expect(chunkIds([], 200)).toEqual([]);
    });
});

describe("partitionSettled", () => {
    it("keeps the fulfilled values and reports a failure", () => {
        const results: PromiseSettledResult<number>[] = [
            { status: "fulfilled", value: 1 },
            { status: "rejected", reason: new Error("down") },
            { status: "fulfilled", value: 3 }
        ];

        expect(partitionSettled(results)).toEqual({ values: [1, 3], failed: true });
        expect(partitionSettled<number>([])).toEqual({ values: [], failed: false });
    });
});

describe("addFoundUsers and addFoundTeams", () => {
    it("add found entries and the users' team ids without touching the other maps", () => {
        const empty = createEmptyRuleReferences();

        const withUsers = addFoundUsers(empty, [
            { id: "user-1", displayName: "Ada Lovelace", teamIds: ["team-1", "team-2"] }
        ]);
        const withTeams = addFoundTeams(withUsers, [
            { id: "team-1", name: "Editors", memberCount: 3 }
        ]);

        expect(withTeams.users.get("user-1")).toEqual({
            id: "user-1",
            label: "Ada Lovelace",
            state: "found"
        });
        expect(withTeams.userTeamIds.get("user-1")).toEqual(["team-1", "team-2"]);
        expect(withTeams.teams.get("team-1")).toEqual({
            id: "team-1",
            label: "Editors",
            state: "found"
        });
        expect(empty.users.size).toBe(0);
    });

    it("replaces an older entry of the same id", () => {
        const deleted = createRuleReferences({
            users: [{ id: "user-1", label: "Deleted user", state: "deleted" }]
        });

        const found = addFoundUsers(deleted, [
            { id: "user-1", displayName: "Ada Lovelace", teamIds: [] }
        ]);

        expect(found.users.get("user-1")?.state).toBe("found");
    });
});

describe("resolveRuleReferences (R298)", () => {
    const requested = {
        userIds: ["user-1", "user-2"],
        teamIds: ["team-8", "team-9"],
        folders: [
            { id: "f1", type: "cms:article" },
            { id: "f2", type: "cms:article" },
            { id: "f3", type: "cms:article" },
            { id: "f4", type: "cms:article" }
        ]
    };

    it("labels found, deleted, restricted and unresolved references", () => {
        const references = resolveRuleReferences({
            previous: createEmptyRuleReferences(),
            requested,
            users: [{ id: "user-1", displayName: "Ada Lovelace", teamIds: ["team-1"] }],
            missingUserIds: ["user-2"],
            teams: [{ id: "team-8", name: "Marketing", memberCount: 2 }],
            missingTeamIds: ["team-9"],
            folders: [{ id: "f1", path: "/News" }],
            folderExistence: new Map([
                ["f2", true],
                ["f3", false]
            ])
        });

        expect(references.users.get("user-1")).toEqual({
            id: "user-1",
            label: "Ada Lovelace",
            state: "found"
        });
        expect(references.userTeamIds.get("user-1")).toEqual(["team-1"]);
        expect(references.users.get("user-2")).toEqual({
            id: "user-2",
            label: "Deleted user",
            state: "deleted"
        });
        expect(references.teams.get("team-8")?.label).toBe("Marketing");
        expect(references.teams.get("team-9")).toEqual({
            id: "team-9",
            label: "Deleted team",
            state: "deleted"
        });
        expect(references.folders.get("f1")).toEqual({
            id: "f1",
            label: "/News",
            state: "found"
        });
        expect(references.folders.get("f2")).toEqual({
            id: "f2",
            label: "Restricted folder",
            state: "restricted"
        });
        expect(references.folders.get("f3")).toEqual({
            id: "f3",
            label: "Deleted folder",
            state: "deleted"
        });
        // No answer for f4 (the existence check failed): it stays unresolved.
        expect(references.folders.has("f4")).toBe(false);
    });

    it("keeps what was resolved before and does not change the previous maps", () => {
        const previous = createRuleReferences({
            users: [{ id: "user-7", label: "Grace Hopper", state: "found" }]
        });

        const references = resolveRuleReferences({
            previous,
            requested: { userIds: [], teamIds: [], folders: [] },
            users: [],
            missingUserIds: [],
            teams: [],
            missingTeamIds: [],
            folders: [],
            folderExistence: new Map()
        });

        expect(references.users.get("user-7")?.label).toBe("Grace Hopper");
        expect(references).not.toBe(previous);
    });
});

describe("pruneRuleReferences", () => {
    it("keeps only the entries of the wanted ids", () => {
        const references = createRuleReferences({
            users: [
                { id: "user-1", label: "Ada", state: "found" },
                { id: "user-2", label: "Deleted user", state: "deleted" }
            ],
            teams: [{ id: "team-8", label: "Marketing", state: "found" }],
            folders: [{ id: "f1", label: "/News", state: "found" }],
            userTeamIds: { "user-1": ["team-1"], "user-2": [] }
        });

        const pruned = pruneRuleReferences(references, {
            userIds: ["user-1"],
            teamIds: [],
            folders: [{ id: "f1", type: "cms:article" }]
        });

        expect([...pruned.users.keys()]).toEqual(["user-1"]);
        expect([...pruned.userTeamIds.keys()]).toEqual(["user-1"]);
        expect(pruned.teams.size).toBe(0);
        expect([...pruned.folders.keys()]).toEqual(["f1"]);
    });
});
```

Add to `packages/app-workflows/src/editor/model/isStepReadOnly.test.ts` (no new imports; a helper and a `describe` at the end; `isReviewAvailable` itself is tested by Task 12):

```ts
const withoutReview = () => {
    return createStepTypes().map(item => {
        return item.type === "review"
            ? { ...item, available: false, unavailableReason: "Teams are not enabled." }
            : item;
    });
};

describe("isStepReadOnly with teams off (R309)", () => {
    it("is true for a People step while the review row is unavailable", () => {
        expect(isStepReadOnly(createReviewStep(), withoutReview())).toBe(true);
    });

    it("keeps Automation and AI steps editable while teams are off", () => {
        expect(isStepReadOnly(createAutomationStep(), withoutReview())).toBe(false);
        expect(isStepReadOnly(createAiStep(), withoutReview())).toBe(false);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { EditorStep } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import type { EditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";

const FOLDER_TYPE = "cms:article";

const withWorkflow = (steps: EditorStep[]): EditorPresenterSetup => {
    const setup = createEditorPresenterSetup();
    setup.useCases.getWorkflow.mockResolvedValue(createEditorWorkflow({ steps }));
    setup.app.listFolders.mockResolvedValue([]);
    setup.useCases.folderExists.mockResolvedValue(true);
    return setup;
};

// `listUsers({ ids })` answers the directory's users and reports the other ids as missing.
const answerUsers = (setup: EditorPresenterSetup, directory: WorkflowUserSummary[]): void => {
    setup.config.listUsers.mockImplementation(async params => {
        const ids = params.ids ?? [];
        const users = directory.filter(user => ids.includes(user.id));
        const missingIds = ids.filter(id => !directory.some(user => user.id === id));
        return { users, missingIds };
    });
};

const answerTeams = (setup: EditorPresenterSetup, directory: WorkflowTeamSummary[]): void => {
    setup.config.listTeams.mockImplementation(async params => {
        const ids = params.ids ?? [];
        const teams = directory.filter(team => ids.includes(team.id));
        const missingIds = ids.filter(id => !directory.some(team => team.id === id));
        return { teams, missingIds };
    });
};

const fullRules = () => {
    return [
        createStoredRule({
            id: "r1",
            requesterUserId: "user-1",
            requesterTeamId: "team-9",
            folder: { id: "f1", type: FOLDER_TYPE, includeDescendants: true },
            target: { type: "user", id: "user-2" }
        }),
        createStoredRule({
            id: "r2",
            folder: { id: "f2", type: FOLDER_TYPE, includeDescendants: false },
            target: { type: "team", id: "team-1" }
        }),
        createStoredRule({
            id: "r3",
            folder: { id: "f3", type: FOLDER_TYPE, includeDescendants: false },
            target: { type: "user", id: "user-3" }
        })
    ];
};

describe("WorkflowEditorPresenter: saved references (R298, D117, Review Focus 4)", () => {
    it("resolves users, rule teams and folders by id after the workflow loads", async () => {
        const setup = withWorkflow([createRoutingStep(fullRules())]);
        answerUsers(setup, [
            createListedUser("user-1", "Ada Lovelace", ["team-1"]),
            createListedUser("user-3", "Grace Hopper", ["team-1"])
        ]);
        answerTeams(setup, [
            createWorkflowTeamSummary({ id: "team-1", name: "Editors" }),
            createWorkflowTeamSummary({ id: "team-9", name: "Marketing" })
        ]);
        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);
        setup.useCases.folderExists.mockImplementation(async params => params.id === "f2");

        await setup.presenter.init(setup.params);

        const references = setup.presenter.getReferences();
        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: ["user-1", "user-2", "user-3"],
            teamIds: null,
            limit: null
        });
        expect(references.users.get("user-1")).toEqual({
            id: "user-1",
            label: "Ada Lovelace",
            state: "found"
        });
        expect(references.userTeamIds.get("user-1")).toEqual(["team-1"]);
        expect(references.users.get("user-2")).toEqual({
            id: "user-2",
            label: "Deleted user",
            state: "deleted"
        });
        expect(references.teams.get("team-9")?.label).toBe("Marketing");
        expect(references.folders.get("f1")).toEqual({
            id: "f1",
            label: "/News",
            state: "found"
        });
        expect(references.folders.get("f2")?.state).toBe("restricted");
        expect(references.folders.get("f3")).toEqual({
            id: "f3",
            label: "Deleted folder",
            state: "deleted"
        });
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("looks a rule team up only when the step teams did not already resolve it", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({ id: "r1", requesterTeamId: "team-9" }),
                createStoredRule({ id: "r2", target: { type: "team", id: "team-1" } })
            ])
        ]);
        answerTeams(setup, [
            createWorkflowTeamSummary({ id: "team-1", name: "Editors" }),
            createWorkflowTeamSummary({ id: "team-9", name: "Marketing" })
        ]);

        await setup.presenter.init(setup.params);

        expect(setup.config.listTeams).toHaveBeenCalledTimes(2);
        expect(setup.config.listTeams).toHaveBeenNthCalledWith(1, {
            search: null,
            ids: ["team-1"],
            limit: null
        });
        expect(setup.config.listTeams).toHaveBeenNthCalledWith(2, {
            search: null,
            ids: ["team-9"],
            limit: null
        });
        expect(setup.presenter.getReferences().teams.get("team-1")?.label).toBe("Editors");
    });

    it("asks the folder list once, with the model id, and folderExists once per distinct unlisted id", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({
                    id: "r1",
                    folder: { id: "f2", type: FOLDER_TYPE, includeDescendants: false }
                }),
                createStoredRule({
                    id: "r2",
                    folder: { id: "f2", type: FOLDER_TYPE, includeDescendants: true }
                }),
                createStoredRule({
                    id: "r3",
                    folder: { id: "f1", type: FOLDER_TYPE, includeDescendants: false }
                })
            ])
        ]);
        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);

        await setup.presenter.init(setup.params);

        expect(setup.app.listFolders).toHaveBeenCalledTimes(1);
        expect(setup.app.listFolders).toHaveBeenCalledWith("article");
        expect(setup.useCases.folderExists).toHaveBeenCalledTimes(1);
        expect(setup.useCases.folderExists).toHaveBeenCalledWith({ id: "f2", type: FOLDER_TYPE });
    });

    it("sends a saved folder's own type to folderExists", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({
                    id: "r1",
                    folder: { id: "f9", type: "cms:other", includeDescendants: false }
                })
            ])
        ]);

        await setup.presenter.init(setup.params);

        expect(setup.useCases.folderExists).toHaveBeenCalledWith({ id: "f9", type: "cms:other" });
    });

    it("asks nothing for a workflow whose rules reference nothing", async () => {
        const setup = withWorkflow([createRoutingStep([])]);

        await setup.presenter.init(setup.params);

        expect(setup.config.listUsers).not.toHaveBeenCalled();
        expect(setup.useCases.folderExists).not.toHaveBeenCalled();
        expect(setup.presenter.getReferences().users.size).toBe(0);
    });

    it("asks 200 user ids per call and merges the answers of concurrent chunks", async () => {
        const rules = Array.from({ length: 450 }, (_, index) => {
            return createStoredRule({
                id: `r${index}`,
                target: { type: "user", id: `user-${index}` }
            });
        });
        const setup = withWorkflow([createRoutingStep(rules)]);
        const directory = Array.from({ length: 450 }, (_, index) => {
            return createListedUser(`user-${index}`, `User ${index}`);
        });
        answerUsers(setup, directory);

        await setup.presenter.init(setup.params);

        const sizes = setup.config.listUsers.mock.calls.map(call => (call[0].ids ?? []).length);
        expect(sizes).toEqual([200, 200, 50]);
        expect(setup.presenter.getReferences().users.size).toBe(450);
    });

    it("shows the options banner when a lookup fails, and retry resolves only the unresolved ids", async () => {
        const rules = Array.from({ length: 250 }, (_, index) => {
            return createStoredRule({
                id: `r${index}`,
                target: { type: "user", id: `user-${index}` }
            });
        });
        const setup = withWorkflow([createRoutingStep(rules)]);
        const directory = Array.from({ length: 250 }, (_, index) => {
            return createListedUser(`user-${index}`, `User ${index}`);
        });
        answerUsers(setup, directory);
        setup.config.listUsers.mockImplementationOnce(async params => {
            const ids = params.ids ?? [];
            return { users: directory.filter(user => ids.includes(user.id)), missingIds: [] };
        });
        setup.config.listUsers.mockImplementationOnce(async () => {
            throw new Error("down");
        });

        await setup.presenter.init(setup.params);

        expect(setup.presenter.vm.optionsBanner).toEqual({
            message: "Could not load the step options."
        });
        expect(setup.presenter.getReferences().users.size).toBe(200);

        setup.config.listUsers.mockClear();
        setup.presenter.retryReferences();
        await vi.waitFor(() => expect(setup.presenter.getReferences().users.size).toBe(250));

        expect(setup.config.listUsers).toHaveBeenCalledTimes(1);
        expect(setup.config.listUsers.mock.calls[0][0].ids).toHaveLength(50);
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("reports the resolution status: loading while a lookup runs, failed after one failed", async () => {
        const setup = withWorkflow([
            createRoutingStep([createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })])
        ]);
        const slow = createDeferred<WorkflowUserList>();
        setup.config.listUsers.mockReturnValueOnce(slow.promise);

        const loading = setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.presenter.getReferencesStatus().loading).toBe(true));
        slow.reject(new Error("down"));
        await loading;

        expect(setup.presenter.getReferencesStatus()).toEqual({ loading: false, failed: true });

        answerUsers(setup, [createListedUser("user-1", "Ada Lovelace")]);
        setup.presenter.retryReferences();
        await vi.waitFor(() => {
            expect(setup.presenter.getReferencesStatus()).toEqual({ loading: false, failed: false });
        });
    });

    it("loads the folder list again on Try again after it failed, and shows the banner meanwhile", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({
                    id: "r1",
                    folder: { id: "f1", type: FOLDER_TYPE, includeDescendants: false }
                })
            ])
        ]);
        setup.app.listFolders.mockRejectedValueOnce(new Error("down"));

        await setup.presenter.init(setup.params);

        expect(setup.presenter.vm.optionsBanner).toEqual({
            message: "Could not load the step options."
        });
        expect(setup.useCases.folderExists).not.toHaveBeenCalled();
        expect(setup.presenter.getReferences().folders.has("f1")).toBe(false);

        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);
        await setup.presenter.retryOptions();

        expect(setup.presenter.getReferences().folders.get("f1")?.label).toBe("/News");
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("does not re-resolve a team that a search already returned", async () => {
        const setup = withWorkflow([createRoutingStep([])]);
        await setup.presenter.init(setup.params);
        setup.config.listTeams.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-9", name: "Marketing" })],
            missingIds: []
        });
        setup.presenter.searchTeams("");
        await vi.waitFor(() => {
            expect(setup.presenter.getReferences().teams.get("team-9")?.label).toBe("Marketing");
        });
        setup.config.listTeams.mockClear();

        setup.presenter.updateStep("step-1", {
            config: {
                teams: ["team-1"],
                assignment: {
                    strategy: "none",
                    allowManualPick: false,
                    rules: [createStoredRule({ id: "r1", requesterTeamId: "team-9" })]
                }
            }
        });

        expect(setup.config.listTeams).not.toHaveBeenCalled();
    });

    it("resolves the ids a step edit introduces", async () => {
        const setup = withWorkflow([createRoutingStep([])]);
        answerUsers(setup, [createListedUser("user-4", "Alan Turing")]);
        await setup.presenter.init(setup.params);
        expect(setup.config.listUsers).not.toHaveBeenCalled();

        setup.presenter.updateStep("step-1", {
            config: {
                teams: ["team-1"],
                assignment: {
                    strategy: "none",
                    allowManualPick: false,
                    rules: [
                        createStoredRule({ id: "r1", target: { type: "user", id: "user-4" } })
                    ]
                }
            }
        });

        await vi.waitFor(() => {
            expect(setup.presenter.getReferences().users.get("user-4")?.label).toBe("Alan Turing");
        });
    });

    it("drops the answer of a lookup that a workflow switch replaced", async () => {
        const setup = withWorkflow([
            createRoutingStep([createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })])
        ]);
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow({ modelId: "article", name: "Article" }),
                    createWorkflowModelRow({
                        model: "cms.blog",
                        modelId: "blog",
                        name: "Blog",
                        workflow: { id: "workflow-2", name: "Blog review" }
                    })
                ]
            })
        );
        setup.useCases.getWorkflow.mockImplementation(async id => {
            if (id === "workflow-2") {
                return createEditorWorkflow({ id: "workflow-2", steps: [createRoutingStep([])] });
            }
            return createEditorWorkflow({
                steps: [
                    createRoutingStep([
                        createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
                    ])
                ]
            });
        });
        const slow = createDeferred<WorkflowUserList>();
        setup.config.listUsers.mockReturnValueOnce(slow.promise);

        const loading = setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.config.listUsers).toHaveBeenCalledTimes(1));
        await setup.presenter.selectModel("blog");
        slow.resolve({ users: [createListedUser("user-1", "Ada Lovelace")], missingIds: [] });
        await loading;

        expect(setup.presenter.getReferences().users.size).toBe(0);
    });

    it("drops the answer of a lookup that a newer step edit replaced", async () => {
        const setup = withWorkflow([
            createRoutingStep([createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })])
        ]);
        answerUsers(setup, [
            createListedUser("user-1", "Ada Lovelace"),
            createListedUser("user-3", "Alan Turing")
        ]);
        const slow = createDeferred<WorkflowUserList>();
        setup.config.listUsers.mockReturnValueOnce(slow.promise);

        const loading = setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.config.listUsers).toHaveBeenCalledTimes(1));
        setup.presenter.updateStep("step-1", {
            config: {
                teams: ["team-1"],
                assignment: {
                    strategy: "none",
                    allowManualPick: false,
                    rules: [
                        createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } }),
                        createStoredRule({ id: "r2", target: { type: "user", id: "user-3" } })
                    ]
                }
            }
        });
        await vi.waitFor(() => {
            expect(setup.presenter.getReferences().users.get("user-3")?.label).toBe("Alan Turing");
        });
        slow.resolve({ users: [createListedUser("user-1", "Stale name")], missingIds: [] });
        await loading;

        expect(setup.presenter.getReferences().users.get("user-1")?.label).toBe("Ada Lovelace");
    });

    it("does not look a reference up again once every step dropped it", async () => {
        const setup = withWorkflow([
            createRoutingStep([createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })])
        ]);
        setup.config.listUsers.mockRejectedValue(new Error("down"));
        await setup.presenter.init(setup.params);
        expect(setup.config.listUsers).toHaveBeenCalledTimes(1);

        setup.presenter.updateStep("step-1", {
            config: {
                teams: ["team-1"],
                assignment: { strategy: "none", allowManualPick: false, rules: [] }
            }
        });
        setup.config.listUsers.mockClear();
        setup.presenter.retryReferences();

        expect(setup.config.listUsers).not.toHaveBeenCalled();
    });

    it("rebuilds the maps from the saved ids after a successful save", async () => {
        const setup = withWorkflow([
            createRoutingStep([createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })])
        ]);
        answerUsers(setup, [
            createListedUser("user-1", "Ada Lovelace"),
            createListedUser("user-2", "Grace Hopper")
        ]);
        await setup.presenter.init(setup.params);
        expect(setup.presenter.getReferences().users.has("user-1")).toBe(true);
        setup.useCases.storeWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createRoutingStep([
                        createStoredRule({ id: "r1", target: { type: "user", id: "user-2" } })
                    ])
                ]
            })
        );
        setup.presenter.setName("Changed");
        setup.config.listUsers.mockClear();

        await setup.presenter.save();

        await vi.waitFor(() => {
            expect(setup.presenter.getReferences().users.get("user-2")?.label).toBe("Grace Hopper");
        });
        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: ["user-2"],
            teamIds: null,
            limit: null
        });
        expect(setup.presenter.getReferences().users.has("user-1")).toBe(false);
    });
});

describe("WorkflowEditorPresenter: teams off (R290, R309, Review Focus 5)", () => {
    const withTeamsOff = (steps: EditorStep[]): EditorPresenterSetup => {
        const setup = withWorkflow(steps);
        setup.config.listStepTypes.mockResolvedValue(
            createStepTypes().map(item => {
                return item.type === "review"
                    ? { ...item, available: false, unavailableReason: "Teams are not enabled." }
                    : item;
            })
        );
        return setup;
    };

    it("makes no team, user or folder lookup for a saved People step", async () => {
        const setup = withTeamsOff([createRoutingStep(fullRules())]);

        await setup.presenter.init(setup.params);

        expect(setup.config.listTeams).not.toHaveBeenCalled();
        expect(setup.config.listUsers).not.toHaveBeenCalled();
        expect(setup.app.listFolders).not.toHaveBeenCalled();
        expect(setup.useCases.folderExists).not.toHaveBeenCalled();
        expect(setup.presenter.getReferences().users.size).toBe(0);
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("reports a People step read-only and leaves the others editable", async () => {
        const setup = withTeamsOff([createRoutingStep([])]);

        await setup.presenter.init(setup.params);

        expect(setup.presenter.isStepReadOnly("step-1")).toBe(true);
    });
});
```

- [ ] **Step 2: Run the tests and expect failure**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/referencesPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/isStepReadOnly.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts 2>&1 | tail -30
```

Expected: the first fails with `Failed to resolve import "./addFoundTeams.js"` (the new files do not exist); the second fails on the teams-off People step (`isStepReadOnly` returns false); the third with `presenter.getReferences is not a function`.

- [ ] **Step 3: Implement**

Replace `packages/app-workflows/src/editor/model/isStepReadOnly.ts` with (it imports Task 12's `isReviewAvailable`):

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { isAiEditable } from "./isAiEditable.js";
import { isReviewAvailable } from "./isReviewAvailable.js";

const KNOWN_TYPES: string[] = Object.values(StepTypeId);

/*
 * A step of a type the editor has no form for, an AI step while the AI editor does not exist and
 * a People step while teams are off are shown read-only and saved unchanged (R270, R275, R309).
 * Move and delete stay enabled (QBZ-47).
 */
export const isStepReadOnly = (step: EditorStep, stepTypes: EditorStepType[]): boolean => {
    if (!KNOWN_TYPES.includes(step.type)) {
        return true;
    }
    if (step.type === StepTypeId.Review) {
        return !isReviewAvailable(stepTypes);
    }
    return step.type === StepTypeId.Ai && !isAiEditable(stepTypes);
};
```

Create `packages/app-workflows/src/editor/presentation/editor/RuleReferenceIds.ts`:

```ts
// A folder a rule holds: the id and the folder `type` it was saved with (`folderExists` needs it).
export interface RuleFolderRef {
    id: string;
    type: string;
}

// The distinct ids the rules of the open workflow reference (R298).
export interface RuleReferenceIds {
    userIds: string[];
    teamIds: string[];
    folders: RuleFolderRef[];
}
```

Create `packages/app-workflows/src/editor/model/getUserSettingKeys.ts`:

```ts
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { isRecord } from "./isRecord.js";

// The top-level settings of an automation's schema that carry the `user` ui hint (R271, R285).
export const getUserSettingKeys = (schema: JsonSchema | null): string[] => {
    const record: unknown = schema;
    if (!isRecord(record) || !isRecord(record.properties)) {
        return [];
    }
    return Object.entries(record.properties)
        .filter(([, property]) => isRecord(property) && property.ui === "user")
        .map(([key]) => key);
};
```

Create `packages/app-workflows/src/editor/model/getUserSettingKeys.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { getUserSettingKeys } from "./getUserSettingKeys.js";

describe("getUserSettingKeys (R271, R285)", () => {
    it("lists the top-level settings that carry the user ui hint", () => {
        const schema: JsonSchema = {
            type: "object",
            properties: {
                owner: { type: "string", ui: "user" },
                url: { type: "string" },
                backup: { type: "string", ui: "user" }
            }
        };

        expect(getUserSettingKeys(schema)).toEqual(["owner", "backup"]);
    });

    it("is empty for no schema, no properties and other hints", () => {
        expect(getUserSettingKeys(null)).toEqual([]);
        expect(getUserSettingKeys({ type: "object" })).toEqual([]);
        expect(
            getUserSettingKeys({
                type: "object",
                properties: { who: { type: "string", ui: "team" } }
            })
        ).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/collectRuleReferenceIds.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { readAssignment } from "~/editor/model/assignment/readAssignment.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { getUserSettingKeys } from "~/editor/model/getUserSettingKeys.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { RuleReferenceIds } from "./RuleReferenceIds.js";

function addUnique(list: string[], id: string | null): void {
    if (id !== null && id !== "" && !list.includes(id)) {
        list.push(id);
    }
}

function addRule(ids: RuleReferenceIds, rule: RuleValue): void {
    addUnique(ids.userIds, rule.requesterUserId);
    addUnique(ids.teamIds, rule.requesterTeamId);

    const target = rule.target;
    if (target !== null && target.type === "user") {
        addUnique(ids.userIds, target.id);
    }
    if (target !== null && target.type === "team") {
        addUnique(ids.teamIds, target.id);
    }

    const folder = rule.folder;
    if (folder !== null && !ids.folders.some(item => item.id === folder.id)) {
        ids.folders.push({ id: folder.id, type: folder.type });
    }
}

// A `ui: "user"` setting holds one user id; its keys come from the step's definition (R271, R285).
function addAutomationUsers(
    ids: RuleReferenceIds,
    step: EditorStep,
    automations: AutomationDefinition[]
): void {
    const config = readAutomationConfig(step.config);
    const definition = automations.find(item => item.id === config.automationId);
    if (!definition) {
        return;
    }
    for (const key of getUserSettingKeys(definition.settingsSchema)) {
        const value = config.settings[key];
        if (typeof value === "string") {
            addUnique(ids.userIds, value);
        }
    }
}

/*
 * The users, teams and folders the rules of every People step reference, and the users of the
 * `ui: "user"` settings of the Automation steps, distinct and in step and rule order (R298). A
 * People step of an unavailable `review` row is not resolved (teams off, R290); an Automation step
 * does not depend on teams. The steps' own teams stay on the 9a path.
 */
export const collectRuleReferenceIds = (
    steps: EditorStep[],
    reviewAvailable: boolean,
    automations: AutomationDefinition[]
): RuleReferenceIds => {
    const ids: RuleReferenceIds = { userIds: [], teamIds: [], folders: [] };
    for (const step of steps) {
        if (step.type === StepTypeId.Automation) {
            addAutomationUsers(ids, step, automations);
        }
        if (step.type !== StepTypeId.Review || !reviewAvailable) {
            continue;
        }
        const config = readReviewConfig(step.config);
        const assignment = readAssignment(config.assignment);
        for (const rule of assignment.rules) {
            addRule(ids, rule);
        }
    }
    return ids;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/findUnresolvedReferenceIds.ts`:

```ts
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { RuleReferenceIds } from "./RuleReferenceIds.js";

// The wanted ids no map holds yet: resolved ids (found, deleted or restricted) are never asked again.
export const findUnresolvedReferenceIds = (
    wanted: RuleReferenceIds,
    references: RuleReferences
): RuleReferenceIds => {
    return {
        userIds: wanted.userIds.filter(id => !references.users.has(id)),
        teamIds: wanted.teamIds.filter(id => !references.teams.has(id)),
        folders: wanted.folders.filter(folder => !references.folders.has(folder.id))
    };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/chunkIds.ts`:

```ts
// Splits a list into chunks of at most `size`, keeping the order (the server caps an `ids` lookup at 200).
export const chunkIds = <T>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/partitionSettled.ts`:

```ts
export interface SettledValues<T> {
    values: T[];
    // At least one request was rejected.
    failed: boolean;
}

// The fulfilled values of `Promise.allSettled` and whether any request failed.
export const partitionSettled = <T>(results: PromiseSettledResult<T>[]): SettledValues<T> => {
    const values: T[] = [];
    let failed = false;
    for (const result of results) {
        if (result.status === "fulfilled") {
            values.push(result.value);
        } else {
            failed = true;
        }
    }
    return { values, failed };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/addFoundUsers.ts`:

```ts
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { getReferenceLabel } from "~/editor/model/rules/getReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

// Found users (from a lookup or a search) join the maps with their team ids; a new object is returned.
export const addFoundUsers = (
    references: RuleReferences,
    users: WorkflowUserSummary[]
): RuleReferences => {
    if (users.length === 0) {
        return references;
    }
    const labels = new Map(references.users);
    const userTeamIds = new Map(references.userTeamIds);
    for (const user of users) {
        const label = getReferenceLabel({
            kind: "user",
            id: user.id,
            name: user.displayName,
            state: "found"
        });
        labels.set(user.id, label);
        userTeamIds.set(user.id, user.teamIds);
    }
    return { ...references, users: labels, userTeamIds };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/addFoundTeams.ts`:

```ts
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import { getReferenceLabel } from "~/editor/model/rules/getReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

// Found teams (from a lookup, a search or the step teams) join the maps; a new object is returned.
export const addFoundTeams = (
    references: RuleReferences,
    teams: WorkflowTeamSummary[]
): RuleReferences => {
    if (teams.length === 0) {
        return references;
    }
    const labels = new Map(references.teams);
    for (const team of teams) {
        const label = getReferenceLabel({
            kind: "team",
            id: team.id,
            name: team.name,
            state: "found"
        });
        labels.set(team.id, label);
    }
    return { ...references, teams: labels };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/resolveRuleReferences.ts`:

```ts
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { getReferenceLabel } from "~/editor/model/rules/getReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import { addFoundTeams } from "./addFoundTeams.js";
import { addFoundUsers } from "./addFoundUsers.js";
import type { RuleReferenceIds } from "./RuleReferenceIds.js";

export interface ResolveRuleReferencesParams {
    // What was resolved before; kept, and never changed.
    previous: RuleReferences;
    // The ids that were asked for.
    requested: RuleReferenceIds;
    users: WorkflowUserSummary[];
    missingUserIds: string[];
    teams: WorkflowTeamSummary[];
    missingTeamIds: string[];
    // The app's folder list (empty when it did not load).
    folders: AppFolder[];
    // The `folderExists` answers for the requested folders the list does not hold, by folder id.
    folderExistence: ReadonlyMap<string, boolean>;
}

/*
 * Turns the answers of the lookups into labels (R298, `getReferenceLabel` owns the texts): found
 * users and teams by name, ids the server reported missing as deleted, listed folders by path, an
 * unlisted folder that exists as restricted and one that does not as deleted. A requested folder
 * with no answer (the existence check failed) stays unresolved. Pure; returns a new object.
 */
export const resolveRuleReferences = (params: ResolveRuleReferencesParams): RuleReferences => {
    const withUsers = addFoundUsers(params.previous, params.users);
    const withTeams = addFoundTeams(withUsers, params.teams);

    const users = new Map(withTeams.users);
    for (const id of params.missingUserIds) {
        const deleted = getReferenceLabel({ kind: "user", id, name: null, state: "deleted" });
        users.set(id, deleted);
    }
    const teams = new Map(withTeams.teams);
    for (const id of params.missingTeamIds) {
        const deleted = getReferenceLabel({ kind: "team", id, name: null, state: "deleted" });
        teams.set(id, deleted);
    }

    const folders = new Map(withTeams.folders);
    for (const requested of params.requested.folders) {
        const id = requested.id;
        const listed = params.folders.find(folder => folder.id === id);
        if (listed !== undefined) {
            const found = getReferenceLabel({
                kind: "folder",
                id,
                name: listed.path,
                state: "found"
            });
            folders.set(id, found);
            continue;
        }
        const exists = params.folderExistence.get(id);
        if (exists === true) {
            const restricted = getReferenceLabel({
                kind: "folder",
                id,
                name: null,
                state: "restricted"
            });
            folders.set(id, restricted);
        }
        if (exists === false) {
            const deleted = getReferenceLabel({
                kind: "folder",
                id,
                name: null,
                state: "deleted"
            });
            folders.set(id, deleted);
        }
    }

    return { ...withTeams, users, teams, folders };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/pruneRuleReferences.ts`:

```ts
import type { ReferenceLabel } from "~/editor/model/rules/ReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { RuleReferenceIds } from "./RuleReferenceIds.js";

function keepWanted(
    source: ReadonlyMap<string, ReferenceLabel>,
    ids: string[]
): Map<string, ReferenceLabel> {
    const kept = new Map<string, ReferenceLabel>();
    for (const id of ids) {
        const label = source.get(id);
        if (label !== undefined) {
            kept.set(id, label);
        }
    }
    return kept;
}

// Drops every entry no rule references any more (after a save the maps are rebuilt from the saved ids).
export const pruneRuleReferences = (
    references: RuleReferences,
    wanted: RuleReferenceIds
): RuleReferences => {
    const users = keepWanted(references.users, wanted.userIds);
    const teams = keepWanted(references.teams, wanted.teamIds);
    const folders = keepWanted(
        references.folders,
        wanted.folders.map(folder => folder.id)
    );
    const userTeamIds = new Map<string, string[]>();
    for (const id of users.keys()) {
        const teamIds = references.userTeamIds.get(id);
        if (teamIds !== undefined) {
            userTeamIds.set(id, teamIds);
        }
    }
    return { users, teams, folders, userTeamIds };
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/constants.ts`: add after `TEAM_IDS_LIMIT`:

```ts
// The most ids one `listUsers` call may carry (the server refuses more, R286).
export const USER_IDS_LIMIT = 200;
```

Modify `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`: add the type import

```ts
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
```

and add, next to `WorkflowTeamOptions`:

```ts
// The state of the saved-reference resolution, for the pickers' neutral label (R298).
export interface ReferencesStatus {
    loading: boolean;
    failed: boolean;
}
```

and, in `IWorkflowEditorPresenter`, after `retryTeams(): Promise<void>;`:

```ts
    // The resolved users, rule teams and folders of the open workflow (R298).
    getReferences(): RuleReferences;
    // Whether a resolution run is in flight and whether the last one left ids unresolved.
    getReferencesStatus(): ReferencesStatus;
    // Resolves only the ids that are still unresolved, and loads the folder list again after a failure.
    retryReferences(): void;
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`: add

```ts
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { ReferencesStatus } from "~/editor/presentation/editor/abstractions.js";
```

and, in `StepDrawerSource`, after `retryOptions(): Promise<void>;`:

```ts
    // The resolved users, rule teams and folders of the open workflow (R298); replaced, never mutated.
    getReferences(): RuleReferences;
    getReferencesStatus(): ReferencesStatus;
    retryReferences(): void;
```

Modify `packages/app-workflows/src/editor/testing/fakeStepDrawerSource.ts`: add the imports

```ts
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import { createEmptyRuleReferences } from "~/editor/model/rules/createEmptyRuleReferences.js";
import type { ReferencesStatus } from "~/editor/presentation/editor/abstractions.js";
```

the members (after `namespace`):

```ts
    references: RuleReferences = createEmptyRuleReferences();
    referencesStatus: ReferencesStatus = { loading: false, failed: false };
    retryReferences: Mock<() => void> = vi.fn();
```

the annotations in `makeAutoObservable` (after `errors: observableRef,`):

```ts
            references: observableRef,
            referencesStatus: observableRef,
            retryReferences: false,
```

and the methods (after `getNamespace`):

```ts
    getReferences(): RuleReferences {
        return this.references;
    }

    getReferencesStatus(): ReferencesStatus {
        return this.referencesStatus;
    }

    setReferences(references: RuleReferences): void {
        this.references = references;
    }

    setReferencesStatus(status: ReferencesStatus): void {
        this.referencesStatus = status;
    }
```

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`.

Imports (add next to the existing ones; Task 12 already added `isReviewAvailable` and `createEmptyRuleReferences` from `~/editor/model/rules/createEmptyRuleReferences.js`, keep them):

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import type { ReferencesStatus } from "./abstractions.js";
import { addFoundTeams } from "./addFoundTeams.js";
import { chunkIds } from "./chunkIds.js";
import { collectRuleReferenceIds } from "./collectRuleReferenceIds.js";
import { findUnresolvedReferenceIds } from "./findUnresolvedReferenceIds.js";
import { partitionSettled } from "./partitionSettled.js";
import { pruneRuleReferences } from "./pruneRuleReferences.js";
import { resolveRuleReferences } from "./resolveRuleReferences.js";
import { USER_IDS_LIMIT } from "./constants.js";
```

State, after `private teamSearchTimer: ReturnType<typeof setTimeout> | null = null;`:

```ts
    // The users, rule teams and folders the rules reference, by id (R298).
    private references: RuleReferences = createEmptyRuleReferences();
    private referencesFailed = false;
    private referencesLoading = false;
    private referencesToken = 0;
    // The app's folder list of the open model, loaded once; `folderLoad` is the in-flight or settled load.
    private folders: AppFolder[] = [];
    private foldersLoading = false;
    private foldersFailed = false;
    private foldersToken = 0;
    private folderLoad: Promise<AppFolder[] | null> | null = null;
```

In the `makeAutoObservable` call, change `| "modelSearchTimer"\n        >(this, {` to

```ts
            | "modelSearchTimer"
            | "references"
            | "referencesToken"
            | "folders"
            | "foldersToken"
            | "folderLoad"
        >(this, {
```

and change the last option `modelSearchTimer: false\n        });` to

```ts
            modelSearchTimer: false,
            references: observableRef,
            referencesToken: false,
            folders: observableRef,
            foldersToken: false,
            folderLoad: false
        });
```

`retryOptions` (replace the whole method):

```ts
    async retryOptions(): Promise<void> {
        await this.loadOptions();
        await this.resolveTeams();
        await this.reloadReferences();
        // The banner also covers a failed team search of the drawer's picker (R284).
        if (this.teamSearchFailed) {
            await this.retryTeams();
        }
    }
```

`addStep` — replace `this.openStepId = step.id;\n        return step.id;` with:

```ts
        this.openStepId = step.id;
        this.loadFoldersForPeopleSteps();
        return step.id;
```

`updateStep` (replace the whole method):

```ts
    updateStep(stepId: string, patch: EditorStepPatch): void {
        if (this.saving) {
            return;
        }
        this.draft.updateStep(stepId, patch);
        this.clearStepErrors(stepId);
        void this.resolveReferences();
    }
```

After `retryTeams()`:

```ts
    getReferences(): RuleReferences {
        return this.references;
    }

    getReferencesStatus(): ReferencesStatus {
        return { loading: this.referencesLoading, failed: this.referencesFailed };
    }

    retryReferences(): void {
        void this.reloadReferences();
    }
```

`dispose()`: after `this.teamsToken += 1;` add `this.referencesToken += 1;` and `this.foldersToken += 1;`, and after `this.lastTeamSearch = "";` add:

```ts
        this.references = createEmptyRuleReferences();
        this.referencesFailed = false;
        this.referencesLoading = false;
        this.folders = [];
        this.foldersLoading = false;
        this.foldersFailed = false;
        this.folderLoad = null;
```

`buildOptionsBanner`: replace `if (statuses.includes("failed") || this.teamsFailed || this.teamSearchFailed) {` with:

```ts
        const failed =
            statuses.includes("failed") ||
            this.teamsFailed ||
            this.teamSearchFailed ||
            this.referencesFailed ||
            this.foldersFailed;
        if (failed) {
```

`getStepContext` — Task 12 added `references: createEmptyRuleReferences()` and `reviewAvailable: isReviewAvailable(this.stepTypes.items)` there. Replace

```ts
            references: createEmptyRuleReferences(),
            reviewAvailable: isReviewAvailable(this.stepTypes.items)
        };
```

with

```ts
            references: this.references,
            reviewAvailable: this.isReviewAvailable()
        };
```

`save()` — Task 12 added the two params of `validateWorkflowDraft`. Replace

```ts
            references: createEmptyRuleReferences(),
            reviewAvailable: isReviewAvailable(this.stepTypes.items)
        });
        const invalid =
```

with

```ts
            references: this.references,
            reviewAvailable: this.isReviewAvailable()
        });
        const invalid =
```

`openModel` — replace

```ts
        await this.resolveTeams();
    }

    private beginOpen(row: WorkflowModelRow): number {
```

with

```ts
        this.loadFoldersForPeopleSteps();
        await this.resolveTeams();
        await this.resolveReferences();
    }

    private beginOpen(row: WorkflowModelRow): number {
```

and in `beginOpen`, after `this.resolveToken += 1;` add:

```ts
        this.referencesToken += 1;
        this.foldersToken += 1;
        this.references = createEmptyRuleReferences();
        this.referencesFailed = false;
        this.referencesLoading = false;
        this.folders = [];
        this.foldersLoading = false;
        this.foldersFailed = false;
        this.folderLoad = null;
```

`loadWorkflowInto` — replace the last lines

```ts
            return;
        }
        await this.resolveTeams();
    }

    private applyReloaded(workflow: EditorWorkflow): void {
```

with

```ts
            return;
        }
        this.loadFoldersForPeopleSteps();
        await this.resolveTeams();
        await this.resolveReferences();
    }

    private applyReloaded(workflow: EditorWorkflow): void {
```

`applySaved` — after `this.stepErrors = [];` (the last line of the method) add:

```ts
        const wanted = collectRuleReferenceIds(
            this.draft.steps,
            this.isReviewAvailable(),
            this.automations.items
        );
        this.references = pruneRuleReferences(this.references, wanted);
        void this.resolveReferences();
```

`resolveTeams` — replace its first two lines

```ts
        const wanted = collectTeamIds(this.draft.steps, this.automations.items);
        const missing = wanted.filter(id => !this.teamsKnown.some(team => team.id === id));
```

with

```ts
        // A People step of an unavailable review row is not resolved: teams are off (R290).
        let steps = this.draft.steps;
        if (!this.isReviewAvailable()) {
            steps = steps.filter(step => step.type !== StepTypeId.Review);
        }
        const wanted = collectTeamIds(steps, this.automations.items);
        const missing = wanted.filter(id => !this.teamsKnown.some(team => team.id === id));
```

`applyResolvedTeams` and `applyTeamResults` — each gains one line after its `teamsKnown` merge:

```ts
    private applyResolvedTeams(teams: WorkflowTeamSummary[]): void {
        this.teamsFailed = false;
        this.teamsKnown = mergeTeams(this.teamsKnown, teams);
        this.references = addFoundTeams(this.references, teams);
    }
```

```ts
    private applyTeamResults(teams: WorkflowTeamSummary[]): void {
        this.teamResults = teams;
        this.teamsKnown = mergeTeams(this.teamsKnown, teams);
        this.references = addFoundTeams(this.references, teams);
        this.teamsLoading = false;
    }
```

New private methods, added before `runTeamSearch`:

```ts
    private isReviewAvailable(): boolean {
        return isReviewAvailable(this.stepTypes.items);
    }

    // Loads the folder list for a workflow that has a People step; the load is shared and cached.
    private loadFoldersForPeopleSteps(): void {
        if (this.draft.steps.some(step => step.type === StepTypeId.Review)) {
            void this.loadFolders();
        }
    }

    // The folder list of the open model, loaded once; null when it is not available or failed.
    private loadFolders(): Promise<AppFolder[] | null> {
        const params = this.params;
        const row = this.selectedRow;
        if (params === null || row === null || !this.isReviewAvailable()) {
            return Promise.resolve(null);
        }
        if (this.folderLoad === null) {
            this.folderLoad = this.fetchFolders(params, row.modelId);
        }
        return this.folderLoad;
    }

    private async fetchFolders(
        params: WorkflowEditorInitParams,
        modelId: string
    ): Promise<AppFolder[] | null> {
        const token = this.foldersToken;
        this.foldersLoading = true;
        this.foldersFailed = false;
        try {
            const folders = await params.app.listFolders(modelId);
            if (token !== this.foldersToken) {
                return null;
            }
            this.applyFolders(folders);
            return folders;
        } catch {
            if (token === this.foldersToken) {
                this.applyFoldersFailure();
            }
            return null;
        }
    }

    private applyFolders(folders: AppFolder[]): void {
        this.folders = folders;
        this.foldersLoading = false;
        this.foldersFailed = false;
    }

    private applyFoldersFailure(): void {
        this.foldersLoading = false;
        this.foldersFailed = true;
        // The next attempt loads the list again.
        this.folderLoad = null;
    }

    private async reloadReferences(): Promise<void> {
        if (this.foldersFailed) {
            await this.loadFolders();
        }
        await this.resolveReferences();
    }

    private async resolveReferences(): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        this.references = addFoundTeams(this.references, this.teamsKnown);
        const wanted = collectRuleReferenceIds(
            this.draft.steps,
            this.isReviewAvailable(),
            this.automations.items
        );
        const missing = findUnresolvedReferenceIds(wanted, this.references);
        const nothing =
            missing.userIds.length === 0 &&
            missing.teamIds.length === 0 &&
            missing.folders.length === 0;
        if (nothing) {
            this.referencesFailed = false;
            this.referencesLoading = false;
            return;
        }

        this.referencesToken += 1;
        const token = this.referencesToken;
        this.referencesLoading = true;
        const userChunks = chunkIds(missing.userIds, USER_IDS_LIMIT);
        const userCalls = userChunks.map(ids => {
            return this.config.listUsers({ search: null, ids, teamIds: null, limit: null });
        });
        const teamChunks = chunkIds(missing.teamIds, TEAM_IDS_LIMIT);
        const teamCalls = teamChunks.map(ids => {
            return this.config.listTeams({ search: null, ids, limit: null });
        });
        const needsFolders = missing.folders.length > 0;
        const folderList = needsFolders ? this.loadFolders() : Promise.resolve(this.folders);

        const settledUsers = Promise.allSettled(userCalls);
        const settledTeams = Promise.allSettled(teamCalls);
        const [userAnswers, teamAnswers, listed] = await Promise.all([
            settledUsers,
            settledTeams,
            folderList
        ]);
        if (token !== this.referencesToken) {
            return;
        }

        const listedFolders = listed ?? [];
        const unlisted = missing.folders.filter(folder => {
            return !listedFolders.some(item => item.id === folder.id);
        });
        // Without the list nothing can be told apart, so no existence check is sent.
        let existenceAnswers: PromiseSettledResult<boolean>[] = [];
        if (listed !== null) {
            const existenceCalls = unlisted.map(folder => {
                return params.useCases.folderExists({ id: folder.id, type: folder.type });
            });
            existenceAnswers = await Promise.allSettled(existenceCalls);
        }
        if (token !== this.referencesToken) {
            return;
        }

        const folderExistence = new Map<string, boolean>();
        let existenceFailed = false;
        for (const [index, answer] of existenceAnswers.entries()) {
            if (answer.status === "fulfilled") {
                folderExistence.set(unlisted[index].id, answer.value);
            } else {
                existenceFailed = true;
            }
        }

        const users = partitionSettled(userAnswers);
        const teams = partitionSettled(teamAnswers);
        const foldersMissing = needsFolders && listed === null;
        const failed = users.failed || teams.failed || existenceFailed || foldersMissing;
        const foundUsers = users.values.flatMap(list => list.users);
        const missingUserIds = users.values.flatMap(list => list.missingIds);
        const foundTeams = teams.values.flatMap(list => list.teams);
        const missingTeamIds = teams.values.flatMap(list => list.missingIds);
        this.applyResolvedReferences(
            {
                previous: this.references,
                requested: missing,
                users: foundUsers,
                missingUserIds,
                teams: foundTeams,
                missingTeamIds,
                folders: listedFolders,
                folderExistence
            },
            failed
        );
    }

    // One action for both writes: this runs after awaits, outside the action of `resolveReferences`.
    private applyResolvedReferences(params: ResolveRuleReferencesParams, failed: boolean): void {
        this.references = resolveRuleReferences(params);
        this.referencesFailed = failed;
        this.referencesLoading = false;
    }
```

and import the params type next to `resolveRuleReferences`:

```ts
import type { ResolveRuleReferencesParams } from "./resolveRuleReferences.js";
```

- [ ] **Step 4: Run the tests and expect them to pass**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/referencesPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/isStepReadOnly.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts 2>&1 | tail -40
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests that cover the changed code, then the type check**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/collectTeamIds.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -20
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: pass, the build prints no type errors. `WorkflowEditorPresenter.teams.test.ts` still asserts `listTeams` was called once for the step teams: a workflow whose rules reference no rule team asks no second time.

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
git commit -m "feat(app-workflows): resolve the saved references of routing rules in the editor presenter" -m "The editor presenter collects the users, teams and folders the rules of a People step hold and resolves them by id (users and teams in chunks of 200, folders from the app list and then folderExists), with a run token, a retry that asks only the unresolved ids and no lookup while teams are off." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

**Contract notes:**
- The contract lists `resolveRuleReferences.ts` as the resolution. Because the global rule forbids helpers that wrap dependency calls, every `listUsers`, `listTeams`, `folderExists` and `listFolders` call stays inline in the presenter; `resolveRuleReferences.ts` is the pure step that turns the answers into labels. The label texts come from Task 11's `getReferenceLabel`.
- `isStepReadOnly` for a People step of an unavailable `review` row (R309) is implemented here, not in Task 16, because the editor presenter's `isStepReadOnly(stepId)` already uses the model function and Task 14 needs `isReviewAvailable` anyway. Task 16 handles the drawer side (notice, no tabs, no `ruleIssues`).
- The contract names `retryReferences(): void`; it is not async. `retryOptions` awaits the same reload.
- `createEmptyRuleReferences` is Task 11's (`model/rules/`), `isReviewAvailable` is Task 12's, `createRuleReferences` is Task 11's fixture in `ruleFixtures.ts`; this task creates none of them.

**Review fixes (sub-phase review):**
- Dropped the duplicate `isReviewAvailable.ts` (Task 12 creates it and tests it), the duplicate `createEmptyRuleReferences.ts` (Task 11 owns `model/rules/createEmptyRuleReferences.ts`) and the duplicate `createRuleReferences` fixture (Task 11's `ruleFixtures.ts`); imports and the fake source changed accordingly.
- Labels now come from Task 11's `getReferenceLabel` (`referenceTexts.ts` removed).
- The `save` and `getStepContext` hunks now match the text Task 12 leaves behind (`createEmptyRuleReferences()` and `isReviewAvailable(...)`), and Step 0 checks those names.
- `applyResolvedReferences` also writes `referencesFailed`, so both writes happen inside one action after the awaits.
- Added the Automation `ui: "user"` settings to the collected user ids (`getUserSettingKeys`, created here, identical to the file Task 19b describes; the 9b.6 review item asks that the saved ids resolve through this path) with a test. Cross-sub-phase: Task 19b must not create `getUserSettingKeys.ts` or its test again.
- Added `getReferencesStatus()` (`{ loading, failed }`, presenter, `StepDrawerSource`, fake) so Task 16 can fill the `references` slice's `loading` and `failed` that Task 19b's pickers read; the contract names only `getReferences` and `retryReferences`.
