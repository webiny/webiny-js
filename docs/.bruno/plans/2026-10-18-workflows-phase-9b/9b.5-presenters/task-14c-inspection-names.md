### Task 14c: Inspection name lookup

R298, R301; Q55; Copy gap 4; Review Focus 7. Test routing composes its sentences from the inspection (Task 13), and the inspection carries ids: the candidate ids (`candidateIds`), the people the server skipped (`displayName` is null for someone outside the step's teams) and the narrowed team (`narrowedTeamId`). The editor resolves them before composing: `resolveInspectionNames(inspection)` on the editor presenter (and on `StepDrawerSource`) returns `InspectionNames { users; teams }`, names first from the reference maps (Task 14), then only the unknown ids from `listUsers({ ids })` (chunks of 200) and `listTeams({ ids })` (after the maps). A lookup failure resolves with what is known and never throws, so a failed lookup does not fail the test (R301); an id the server reports missing (or a lookup that failed) is simply absent from the maps, and the composer shows `Deleted user` for it (Copy gap 4). The owner of the inspection already carries a name and is never looked up.

- **No wrapper helper:** the `listUsers` and `listTeams` calls are inline in the presenter method. The new files are pure: `collectInspectionLookupIds` (which ids are unknown) and `buildInspectionNames` (maps and answers into names).
- **Maps first:** only a `found` reference gives a name; a `deleted` or `restricted` reference is known to have no name and is not looked up again (the composer falls back).

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/editor/collectInspectionLookupIds.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/buildInspectionNames.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/inspectionNamesPure.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.inspectionNames.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/testing/fakeStepDrawerSource.ts`

**Interfaces:**
- Consumes: Task 13 (`InspectionNames { users: ReadonlyMap<string, string>; teams: ReadonlyMap<string, string> }`, expected in `~/editor/model/testRouting/TestRoutingContext.js`), Task 7 (`RoutingInspection`, `RoutingSkippedPerson { userId; displayName: string | null; reason }`), Task 14 (`references`, `chunkIds`, `partitionSettled`, `USER_IDS_LIMIT`, `TEAM_IDS_LIMIT`, `createListedUser`, `createTestInspection` from Task 14b, `createRoutingStep`, `createStoredRule`), Task 6 (`config.listUsers`), Task 11 (`createRuleReferences` in `[AWET]/ruleFixtures.ts`).
- Produces: `IWorkflowEditorPresenter.resolveInspectionNames(inspection: RoutingInspection): Promise<InspectionNames>` (and `StepDrawerSource`, `FakeStepDrawerSource.resolveInspectionNames` mock), `collectInspectionLookupIds`, `buildInspectionNames`.

**Test runner note:** admin package, `yarn test <path>` only. Type check: `yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30`.

- [ ] **Step 0: Preconditions**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
grep -rn "InspectionNames" packages/app-workflows/src/editor/model/testRouting/
grep -n "RoutingSkippedPerson" -A5 packages/app-workflows/src/editor/domain/types.ts
```

`InspectionNames` must be exported (Task 13 puts it with `TestRoutingContext`); if it lives in another file of `model/testRouting/`, change the import path in the files below and record it under "Contract notes".

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/editor/inspectionNamesPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createTestInspection } from "~/editor/testing/routingStepFixtures.js";
import { buildInspectionNames } from "./buildInspectionNames.js";
import { collectInspectionLookupIds } from "./collectInspectionLookupIds.js";

describe("collectInspectionLookupIds (R301, Copy gap 4)", () => {
    it("asks for the candidates and the unnamed skipped people the maps do not know", () => {
        const references = createRuleReferences({
            users: [
                { id: "user-1", label: "Ada Lovelace", state: "found" },
                { id: "user-9", label: "Deleted user", state: "deleted" }
            ]
        });
        const inspection = createTestInspection({
            candidateIds: ["user-1", "user-2", "user-9"],
            candidateCount: 3,
            skipped: [
                { userId: "user-3", displayName: null, reason: "Cannot read this content." },
                { userId: "user-4", displayName: "Grace Hopper", reason: "Excluded from reviews." },
                { userId: "user-2", displayName: null, reason: "The requester cannot review." }
            ]
        });

        const ids = collectInspectionLookupIds(inspection, references);

        expect(ids.userIds).toEqual(["user-2", "user-3"]);
        expect(ids.teamIds).toEqual([]);
    });

    it("asks for the narrowed team unless the maps know it", () => {
        const references = createRuleReferences({
            teams: [{ id: "team-1", label: "Editors", state: "found" }]
        });

        const unknown = collectInspectionLookupIds(
            createTestInspection({ narrowedTeamId: "team-9" }),
            references
        );
        const known = collectInspectionLookupIds(
            createTestInspection({ narrowedTeamId: "team-1" }),
            references
        );
        const none = collectInspectionLookupIds(createTestInspection(), references);

        expect(unknown.teamIds).toEqual(["team-9"]);
        expect(known.teamIds).toEqual([]);
        expect(none.teamIds).toEqual([]);
    });
});

describe("buildInspectionNames (R301)", () => {
    it("takes the found references first and adds the looked-up names", () => {
        const references = createRuleReferences({
            users: [
                { id: "user-1", label: "Ada Lovelace", state: "found" },
                { id: "user-9", label: "Deleted user", state: "deleted" }
            ],
            teams: [{ id: "team-1", label: "Editors", state: "found" }]
        });

        const names = buildInspectionNames({
            references,
            users: [createListedUser("user-2", "Grace Hopper")],
            teams: [{ id: "team-9", name: "Marketing", memberCount: 2 }]
        });

        expect([...names.users.entries()]).toEqual([
            ["user-1", "Ada Lovelace"],
            ["user-2", "Grace Hopper"]
        ]);
        expect([...names.teams.entries()]).toEqual([
            ["team-1", "Editors"],
            ["team-9", "Marketing"]
        ]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.inspectionNames.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import type { EditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";
import { createTestInspection } from "~/editor/testing/routingStepFixtures.js";

const DIRECTORY = [
    createListedUser("user-1", "Ada Lovelace"),
    createListedUser("user-2", "Grace Hopper"),
    createListedUser("user-3", "Alan Turing")
];

const answerUsers = (setup: EditorPresenterSetup, directory: WorkflowUserSummary[]): void => {
    setup.config.listUsers.mockImplementation(async params => {
        const ids = params.ids ?? [];
        const users = directory.filter(user => ids.includes(user.id));
        const missingIds = ids.filter(id => !directory.some(user => user.id === id));
        return { users, missingIds };
    });
};

// An opened editor whose only rule targets `user-1`, so the maps know Ada and the team Editors.
const openedSetup = async (): Promise<EditorPresenterSetup> => {
    const setup = createEditorPresenterSetup();
    setup.useCases.getWorkflow.mockResolvedValue(
        createEditorWorkflow({
            steps: [
                createRoutingStep([
                    createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
                ])
            ]
        })
    );
    setup.app.listFolders.mockResolvedValue([]);
    setup.useCases.folderExists.mockResolvedValue(true);
    answerUsers(setup, DIRECTORY);
    setup.config.listTeams.mockImplementation(async params => {
        const ids = params.ids ?? [];
        const known = [
            createWorkflowTeamSummary({ id: "team-1", name: "Editors" }),
            createWorkflowTeamSummary({ id: "team-9", name: "Marketing" })
        ];
        return {
            teams: known.filter(team => ids.includes(team.id)),
            missingIds: ids.filter(id => !known.some(team => team.id === id))
        };
    });
    await setup.presenter.init(setup.params);
    setup.config.listUsers.mockClear();
    setup.config.listTeams.mockClear();
    return setup;
};

describe("WorkflowEditorPresenter: inspection names (R301, Review Focus 7)", () => {
    it("takes names from the maps first and asks nothing when every id is known", async () => {
        const setup = await openedSetup();

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                candidateIds: ["user-1"],
                candidateCount: 1,
                narrowedTeamId: "team-1"
            })
        );

        expect(names.users.get("user-1")).toBe("Ada Lovelace");
        expect(names.teams.get("team-1")).toBe("Editors");
        expect(setup.config.listUsers).not.toHaveBeenCalled();
        expect(setup.config.listTeams).not.toHaveBeenCalled();
    });

    it("looks up only the ids the maps do not know", async () => {
        const setup = await openedSetup();

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                candidateIds: ["user-1", "user-2", "user-3"],
                candidateCount: 5,
                narrowedTeamId: "team-9"
            })
        );

        expect(setup.config.listUsers).toHaveBeenCalledTimes(1);
        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: ["user-2", "user-3"],
            teamIds: null,
            limit: null
        });
        expect(setup.config.listTeams).toHaveBeenCalledTimes(1);
        expect(setup.config.listTeams).toHaveBeenCalledWith({
            search: null,
            ids: ["team-9"],
            limit: null
        });
        expect(names.users.get("user-2")).toBe("Grace Hopper");
        expect(names.users.get("user-3")).toBe("Alan Turing");
        expect(names.teams.get("team-9")).toBe("Marketing");
    });

    it("names a skipped person the server did not name, and leaves the named ones alone", async () => {
        const setup = await openedSetup();

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                skipped: [
                    { userId: "user-2", displayName: null, reason: "Cannot read this content." },
                    { userId: "user-3", displayName: "Alan Turing", reason: "Excluded from reviews." }
                ]
            })
        );

        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: ["user-2"],
            teamIds: null,
            limit: null
        });
        expect(names.users.get("user-2")).toBe("Grace Hopper");
        expect(names.users.has("user-3")).toBe(false);
    });

    it("leaves an id the server reports missing out of the names", async () => {
        const setup = await openedSetup();

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                skipped: [{ userId: "user-77", displayName: null, reason: "Excluded." }]
            })
        );

        expect(setup.config.listUsers).toHaveBeenCalledTimes(1);
        expect(names.users.has("user-77")).toBe(false);
    });

    it("resolves with what is known when a lookup fails, and does not throw", async () => {
        const setup = await openedSetup();
        setup.config.listUsers.mockRejectedValue(new Error("down"));

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                candidateIds: ["user-1", "user-2"],
                candidateCount: 2,
                narrowedTeamId: "team-9"
            })
        );

        expect(names.users.get("user-1")).toBe("Ada Lovelace");
        expect(names.users.has("user-2")).toBe(false);
        expect(names.teams.get("team-9")).toBe("Marketing");
    });

    it("resolves with the users when the team lookup fails", async () => {
        const setup = await openedSetup();
        setup.config.listTeams.mockRejectedValue(new Error("down"));

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                candidateIds: ["user-2"],
                candidateCount: 1,
                narrowedTeamId: "team-9"
            })
        );

        expect(names.users.get("user-2")).toBe("Grace Hopper");
        expect(names.teams.has("team-9")).toBe(false);
    });

    it("asks 200 user ids per call", async () => {
        const setup = await openedSetup();
        const skipped = Array.from({ length: 250 }, (_, index) => {
            return { userId: `user-s${index}`, displayName: null, reason: "Cannot read." };
        });

        await setup.presenter.resolveInspectionNames(createTestInspection({ skipped }));

        const sizes = setup.config.listUsers.mock.calls.map(call => (call[0].ids ?? []).length);
        expect(sizes).toEqual([200, 50]);
    });
});
```

- [ ] **Step 2: Run the tests and expect failure**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/inspectionNamesPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.inspectionNames.test.ts 2>&1 | tail -30
```

Expected: the first fails with `Failed to resolve import "./buildInspectionNames.js"`; the second with `presenter.resolveInspectionNames is not a function`.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/collectInspectionLookupIds.ts`:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

export interface InspectionLookupIds {
    userIds: string[];
    teamIds: string[];
}

function addUnique(list: string[], id: string): void {
    if (!list.includes(id)) {
        list.push(id);
    }
}

/*
 * The ids of an inspection whose names the editor does not know yet (R301): the candidates, the
 * skipped people the server left unnamed (Copy gap 4) and the narrowed team. An id the maps hold in
 * any state is known: found gives a name, deleted or restricted is known to have none. The owner
 * carries its own name. Pure.
 */
export const collectInspectionLookupIds = (
    inspection: RoutingInspection,
    references: RuleReferences
): InspectionLookupIds => {
    const userIds: string[] = [];
    const teamIds: string[] = [];

    for (const id of inspection.candidateIds) {
        if (!references.users.has(id)) {
            addUnique(userIds, id);
        }
    }
    for (const person of inspection.skipped) {
        if (person.displayName === null && !references.users.has(person.userId)) {
            addUnique(userIds, person.userId);
        }
    }

    const narrowed = inspection.narrowedTeamId;
    if (narrowed !== null && !references.teams.has(narrowed)) {
        addUnique(teamIds, narrowed);
    }

    return { userIds, teamIds };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/buildInspectionNames.ts`:

```ts
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { InspectionNames } from "~/editor/model/testRouting/TestRoutingContext.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

export interface BuildInspectionNamesParams {
    references: RuleReferences;
    // The users and teams the lookups found.
    users: WorkflowUserSummary[];
    teams: WorkflowTeamSummary[];
}

/*
 * The names Test routing composes with (R301): the found references first, then the looked-up users
 * and teams. A deleted or restricted reference has no name and is left out. Pure.
 */
export const buildInspectionNames = (params: BuildInspectionNamesParams): InspectionNames => {
    const users = new Map<string, string>();
    for (const label of params.references.users.values()) {
        if (label.state === "found") {
            users.set(label.id, label.label);
        }
    }
    for (const user of params.users) {
        users.set(user.id, user.displayName);
    }

    const teams = new Map<string, string>();
    for (const label of params.references.teams.values()) {
        if (label.state === "found") {
            teams.set(label.id, label.label);
        }
    }
    for (const team of params.teams) {
        teams.set(team.id, team.name);
    }

    return { users, teams };
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`: add

```ts
import type { InspectionNames } from "~/editor/model/testRouting/TestRoutingContext.js";
```

and in `IWorkflowEditorPresenter`, after `inspectRouting(...)`:

```ts
    // The names of an inspection's candidates, skipped people and narrowed team: the maps first, then
    // only the unknown ids; a failed lookup resolves with what is known (R301).
    resolveInspectionNames(inspection: RoutingInspection): Promise<InspectionNames>;
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`: add

```ts
import type { InspectionNames } from "~/editor/model/testRouting/TestRoutingContext.js";
```

and in `StepDrawerSource`, after `inspectRouting(...)`:

```ts
    resolveInspectionNames(inspection: RoutingInspection): Promise<InspectionNames>;
```

Modify `packages/app-workflows/src/editor/testing/fakeStepDrawerSource.ts`: add

```ts
import type { InspectionNames } from "~/editor/model/testRouting/TestRoutingContext.js";
```

the member (after `inspectRouting`):

```ts
    resolveInspectionNames: Mock<(inspection: RoutingInspection) => Promise<InspectionNames>> =
        vi.fn().mockResolvedValue({ users: new Map(), teams: new Map() });
```

and the annotation `resolveInspectionNames: false,` after `inspectRouting: false,`.

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`: imports

```ts
import type { InspectionNames } from "~/editor/model/testRouting/TestRoutingContext.js";
import { buildInspectionNames } from "./buildInspectionNames.js";
import { collectInspectionLookupIds } from "./collectInspectionLookupIds.js";
```

and, after `inspectRouting(...)`:

```ts
    async resolveInspectionNames(inspection: RoutingInspection): Promise<InspectionNames> {
        const ids = collectInspectionLookupIds(inspection, this.references);
        const userChunks = chunkIds(ids.userIds, USER_IDS_LIMIT);
        const userCalls = userChunks.map(chunk => {
            return this.config.listUsers({ search: null, ids: chunk, teamIds: null, limit: null });
        });
        const teamChunks = chunkIds(ids.teamIds, TEAM_IDS_LIMIT);
        const teamCalls = teamChunks.map(chunk => {
            return this.config.listTeams({ search: null, ids: chunk, limit: null });
        });

        // A rejected lookup leaves its ids unnamed; the test itself does not fail (R301).
        const settledUsers = Promise.allSettled(userCalls);
        const settledTeams = Promise.allSettled(teamCalls);
        const [userAnswers, teamAnswers] = await Promise.all([settledUsers, settledTeams]);
        const users = partitionSettled(userAnswers);
        const teams = partitionSettled(teamAnswers);
        const foundUsers = users.values.flatMap(list => list.users);
        const foundTeams = teams.values.flatMap(list => list.teams);

        return buildInspectionNames({
            references: this.references,
            users: foundUsers,
            teams: foundTeams
        });
    }
```

- [ ] **Step 4: Run the tests and expect them to pass**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/inspectionNamesPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.inspectionNames.test.ts 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the tests covering the changed code, then the type check**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.options.test.ts 2>&1 | tail -20
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
git commit -m "feat(app-workflows): resolve the names of a routing inspection in the editor presenter" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

**Contract notes:**
- The contract names `resolveInspectionNames.ts` as the file. The presenter method keeps the contract name; the pure parts live in `collectInspectionLookupIds.ts` and `buildInspectionNames.ts` so no helper wraps a `listUsers` or `listTeams` call (the 8a no-wrapper rule).
- A found lookup is not merged into the reference maps: the names are local to one test run, and the rule references are not changed by a Test routing answer.
- `InspectionNames` is expected in `TestRoutingContext.ts` (the contract lists it with Task 13's `TestRoutingContext`); see Step 0.

**Review fixes (sub-phase review):**
- `createRuleReferences` is imported from Task 11's `ruleFixtures.ts` (Task 14 no longer defines it).
