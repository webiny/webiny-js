### Task 24: Step card lines

R299, R303, R308, R309; Q51, Q53; Review Focus 3, 5; design README 3 and `research-spec.md` 4.7 (step card additions). The People card shows what the earlier tasks compute: the summary (Task 12 `getStepSummary`, R308), the `Rule {n}: ` warning and live error lines (Task 12 `getStepWarnings`, R299), the `Rule {n}: {message}` strip (Task 15 `buildStepCardVm`, R303) and the teams-off line (R309). The card is built by `WorkflowEditorPresenter.buildFlow` from a `StepContext`, so the rule numbers are always the rules' current positions: reorder or delete a rule and the lines renumber with it. This task makes the two things the earlier tasks leave open and proves the whole chain on the card:

- **Severity on the card (consistency ruling, R299):** `getStepWarnings` (Task 12) returns `StepWarningLine { text; severity: "error" | "warning" }` lines. The card keeps them: `StepCardVm.warnings` is `StepWarningLine[]`, and `StepCard` draws an `error` line (a live rule error) destructive (error icon, `text-destructive-primary`, `data-severity="error"`) and a `warning` line as before (amber icon). A live error is not a Save-time strip: it carries no `role="alert"`, and the card border stays neutral until a Save error exists.
- **A line is never shown twice, and a server error replaces the live error of its rule (R299, R303).** After a failed Save the strip shows `Rule {n}: {message}` for the first step error. The card drops (a) the line identical to the strip text and (b) every `error` line of the strip's own rule, because the strip is that rule's current error: a live line with another wording (for example `{Name} is no longer in the reviewing teams.` against the server's `The target user is not a member of the step's teams.`) does not double it. A `warning` line of that rule and the lines of other rules stay. `buildStepCardVm` computes the strip text and the rule's `Rule {n}: ` prefix and passes both to `omitShownError`.
- **The context is complete (check only).** `StepContext` gained `references` and `reviewAvailable` in Task 12, which also makes `getStepContext` pass them; Task 14 replaces the empty references with the resolved ones. This task changes nothing there, and Step 3 only asks you to confirm it, because the People summary, the rule lines and the teams-off line all depend on it.
- **One presenter hunk.** Task 12 left `buildFlow` mapping the lines to plain texts (`const warnings = warningLines.map(line => line.text)`) because the card VM still took strings; this task passes the lines on (Step 3, `WorkflowEditorPresenter.ts` hunk). `ruleIds` (Task 15) is already passed; the card VM is otherwise the only place that changes. Move, Edit and Delete keep their behaviour and the drag handle is untouched.

**Files:** (`[STEP]` = `packages/app-workflows/src/editor/presentation`)
- Create: `[STEP]/editor/ShownCardError.ts`
- Create: `[STEP]/editor/omitShownError.ts`
- Create: `[STEP]/editor/omitShownError.test.ts`
- Create: `[STEP]/editor/WorkflowEditorPresenter.cards.test.ts`
- Modify: `[STEP]/editor/abstractions.ts`
- Modify: `[STEP]/editor/WorkflowEditorPresenter.ts` (one `buildFlow` hunk: pass the warning lines on)
- Modify: `[STEP]/editor/buildStepCardVm.ts`
- Modify: `[STEP]/editor/buildStepCardVm.test.ts`
- Modify: `[STEP]/editor/components/StepCard.tsx`
- Modify: `[STEP]/editor/components/StepCard.test.tsx`

**Interfaces:**
- Consumes (verified in the repo today): `buildStepCardVm` and `StepCardParams` (`[STEP]/editor/buildStepCardVm.ts`), `StepCardVm` (`[STEP]/editor/abstractions.ts`, `warnings: string[]` today), `StepCard` (`[STEP]/editor/components/StepCard.tsx`: warning rows with the amber `WarningIcon`, the strip, `cn`), `WorkflowEditorPresenter.buildFlow`, `createEditorPresenterSetup`, `createEditorWorkflow`, `createEditorStepType`, `createReviewStep`, `StepCard`.
- Consumes (from earlier tasks, verify each against the file as that task left it):
  - Task 12 and the severity ruling: `StepWarningLine { text: string; severity: "error" | "warning" }` in `~/editor/model/StepWarningLine.ts` (the path the drawer chrome, Task 23, imports too; verify it against Task 12 as written, cross-sub-phase item); `getStepSummary(step, context)` and `getStepWarnings(step, context): StepWarningLine[]` with the extended `StepContext { references: RuleReferences; reviewAvailable: boolean; ... }`; the People summary is `{Teams joined with +} · {Team pool|Round-robin|Least-loaded}[ · 1 routing rule | · {n} routing rules][ · requester can pick]` and empty for a People step of an unavailable `review` row; warnings carry the `Rule {n}: ` rule warnings, the live rule errors and, for a People step of an unavailable `review` row, only `This step needs teams, which are not enabled. It can't be edited.`
  - Task 14: the presenter resolves rule references on load (`app.listFolders`, `useCases.folderExists`, `config.listUsers`) and `getReferences(): RuleReferences`; no `listTeams` and no `listUsers` call for an unavailable `review` row.
  - Task 15: `StepCardParams.ruleIds: string[]` (the step's rule ids in order) and the strip text of a rule error `Rule {n}: {message}` with the rule's current position (verified in the written Task 15: the `firstError` / `error` block quoted in Step 3); a failed Save with a rule without a target gives `Rule 1: Choose who this rule assigns to.`
  - Task 6, 7 and 8 fakes: `FakeWorkflowConfigUseCases.listUsers`, `FakeWorkflowEditorUseCases.folderExists` and `FakeEditorAppAdapter.listFolders` are mocks (`mockResolvedValue`).
- Produces: the card lines of R308 as the editor presents them, `ShownCardError { text: string; rulePrefix: string | null }`, `omitShownError(lines: StepWarningLine[], shown: ShownCardError | null): StepWarningLine[]`, `StepCardVm.warnings: StepWarningLine[]`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`; type check by build (R243).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/editor/omitShownError.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import { omitShownError } from "./omitShownError.js";

const warning = (text: string): StepWarningLine => {
    return { text, severity: "warning" };
};

const error = (text: string): StepWarningLine => {
    return { text, severity: "error" };
};

describe("omitShownError (R299, R303)", () => {
    it("keeps every line when no error is shown", () => {
        const lines = [warning("Legal has no members."), error("Rule 1: Choose who this rule assigns to.")];

        expect(omitShownError(lines, null)).toEqual(lines);
    });

    it("drops the line that is identical to the shown error", () => {
        const lines = [
            error("Rule 1: Choose who this rule assigns to."),
            warning("Rule 2: The folder no longer exists.")
        ];
        const shown = { text: "Rule 1: Choose who this rule assigns to.", rulePrefix: "Rule 1: " };

        expect(omitShownError(lines, shown)).toEqual([warning("Rule 2: The folder no longer exists.")]);
    });

    it("drops the live error of the shown rule when it is worded differently", () => {
        const lines = [error("Rule 1: Ana Kovac is no longer in the reviewing teams.")];
        const shown = {
            text: "Rule 1: The target user is not a member of the step's teams.",
            rulePrefix: "Rule 1: "
        };

        expect(omitShownError(lines, shown)).toEqual([]);
    });

    it("keeps a warning of the shown rule and the errors of other rules", () => {
        const lines = [
            warning("Rule 1: The folder no longer exists."),
            error("Rule 2: The assigned user was deleted."),
            error("Rule 10: The team was deleted.")
        ];
        const shown = { text: "Rule 1: Choose who this rule assigns to.", rulePrefix: "Rule 1: " };

        expect(omitShownError(lines, shown)).toEqual(lines);
    });

    it("drops only an identical line for a strip that names no rule", () => {
        const lines = [error("Rule 1: Choose who this rule assigns to."), warning("Enter a title for this step.")];
        const shown = { text: "Enter a title for this step.", rulePrefix: null };

        expect(omitShownError(lines, shown)).toEqual([error("Rule 1: Choose who this rule assigns to.")]);
    });

    it("keeps the order of the other lines and does not change the input", () => {
        const lines = [warning("A"), warning("B"), warning("A"), warning("C")];

        const result = omitShownError(lines, { text: "A", rulePrefix: null });

        expect(result).toEqual([warning("B"), warning("C")]);
        expect(lines).toHaveLength(4);
    });
});
```

Modify `packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts` (Task 15 gave `params` the default `ruleIds: []`). Add the import after the existing imports:

```ts
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
```

Replace the 9a case `carries the read-only flag and the warnings`:

Before:
```ts
    it("carries the read-only flag and the warnings", () => {
        const card = buildStepCardVm(
            params({ readOnly: true, warnings: ["Editors has no members."] })
        );

        expect(card.readOnly).toBe(true);
        expect(card.warnings).toEqual(["Editors has no members."]);
    });
});
```
After (this also adds the new cases at the end of the `describe`):
```ts
    it("carries the read-only flag and the warning lines with their severity", () => {
        const lines: StepWarningLine[] = [
            { text: "Editors has no members.", severity: "warning" },
            { text: "Rule 1: The assigned user was deleted.", severity: "error" }
        ];
        const card = buildStepCardVm(params({ readOnly: true, warnings: lines }));

        expect(card.readOnly).toBe(true);
        expect(card.warnings).toEqual(lines);
    });

    it("does not show a live error twice when the strip already says it (R299)", () => {
        const card = buildStepCardVm(
            params({
                ruleIds: ["r1", "r2"],
                warnings: [
                    { text: "Rule 1: Choose who this rule assigns to.", severity: "error" },
                    { text: "Rule 2: The folder no longer exists.", severity: "warning" }
                ],
                errors: [
                    {
                        field: "config.assignment.rules.target",
                        message: "Choose who this rule assigns to.",
                        ruleId: "r1"
                    }
                ]
            })
        );

        expect(card.error).toBe("Rule 1: Choose who this rule assigns to.");
        expect(card.warnings).toEqual([
            { text: "Rule 2: The folder no longer exists.", severity: "warning" }
        ]);
    });

    it("lets a server error replace the live error of its own rule only (R303)", () => {
        const card = buildStepCardVm(
            params({
                ruleIds: ["r1", "r2"],
                warnings: [
                    {
                        text: "Rule 1: Ana Kovac is no longer in the reviewing teams.",
                        severity: "error"
                    },
                    { text: "Rule 1: The folder no longer exists.", severity: "warning" },
                    { text: "Rule 2: The team was deleted.", severity: "error" }
                ],
                errors: [
                    {
                        field: "config.assignment.rules.target",
                        message: "The target user is not a member of the step's teams.",
                        ruleId: "r1"
                    }
                ]
            })
        );

        expect(card.error).toBe("Rule 1: The target user is not a member of the step's teams.");
        expect(card.warnings).toEqual([
            { text: "Rule 1: The folder no longer exists.", severity: "warning" },
            { text: "Rule 2: The team was deleted.", severity: "error" }
        ]);
    });

    it("keeps every line when the strip is another field's error", () => {
        const lines: StepWarningLine[] = [
            { text: "Rule 1: The folder no longer exists.", severity: "warning" },
            { text: "Rule 2: The team was deleted.", severity: "error" }
        ];
        const card = buildStepCardVm(
            params({
                ruleIds: ["r1", "r2"],
                warnings: lines,
                errors: [{ field: "title", message: "Enter a title for this step.", ruleId: null }]
            })
        );

        expect(card.error).toBe("Enter a title for this step.");
        expect(card.warnings).toEqual(lines);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.cards.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import type { EditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";

const TEAM_TARGET = { type: "team", id: "team-1" };
const FOLDER = { id: "f1", type: "cms:article", includeDescendants: false };

const RULE_PLAIN = { id: "r1", conditions: {}, target: TEAM_TARGET };
const RULE_DELETED_FOLDER = { id: "r2", conditions: { folder: FOLDER }, target: TEAM_TARGET };
const RULE_NO_TARGET = { id: "r1", conditions: {} };

const warningLine = (text: string): StepWarningLine => {
    return { text, severity: "warning" };
};

const errorLine = (text: string): StepWarningLine => {
    return { text, severity: "error" };
};

const assignmentWith = (rules: Record<string, unknown>[]) => {
    return { strategy: "roundRobin", allowManualPick: true, rules };
};

const peopleConfig = (rules: Record<string, unknown>[]) => {
    return { teams: ["team-1"], assignment: assignmentWith(rules) };
};

const openWith = async (rules: Record<string, unknown>[]): Promise<EditorPresenterSetup> => {
    const setup = createEditorPresenterSetup();
    const step = createReviewStep({ config: peopleConfig(rules) });
    setup.useCases.getWorkflow.mockResolvedValue(createEditorWorkflow({ steps: [step] }));
    // The folder of the second rule is in no list and `folderExists` says it is gone.
    setup.app.listFolders.mockResolvedValue([]);
    setup.useCases.folderExists.mockResolvedValue(false);
    await setup.presenter.init(setup.params);
    return setup;
};

const cardOf = (presenter: WorkflowEditorPresenter.Interface) => {
    return presenter.vm.flow.steps[0];
};

describe("WorkflowEditorPresenter: People step card lines (R299, R303, R308, R309)", () => {
    it("summarises the teams, the strategy, the rule count and the requester pick", async () => {
        const { presenter } = await openWith([RULE_PLAIN, RULE_DELETED_FOLDER]);

        expect(cardOf(presenter).summary).toBe(
            "Editors · Round-robin · 2 routing rules · requester can pick"
        );
    });

    it("says 1 routing rule for a single rule", async () => {
        const { presenter } = await openWith([RULE_PLAIN]);

        expect(cardOf(presenter).summary).toBe(
            "Editors · Round-robin · 1 routing rule · requester can pick"
        );
    });

    it("prefixes the warning of a rule with its number", async () => {
        const { presenter } = await openWith([RULE_PLAIN, RULE_DELETED_FOLDER]);

        await vi.waitFor(() => {
            expect(cardOf(presenter).warnings).toEqual([
                warningLine("Rule 2: The folder no longer exists.")
            ]);
        });
        expect(cardOf(presenter).error).toBeNull();
    });

    it("renumbers the lines when the rules are reordered and does not look the folder up again", async () => {
        const { presenter, useCases } = await openWith([RULE_PLAIN, RULE_DELETED_FOLDER]);
        await vi.waitFor(() => {
            expect(cardOf(presenter).warnings).toEqual([
                warningLine("Rule 2: The folder no longer exists.")
            ]);
        });

        presenter.updateStep("step-1", {
            config: peopleConfig([RULE_DELETED_FOLDER, RULE_PLAIN])
        });

        expect(cardOf(presenter).warnings).toEqual([
            warningLine("Rule 1: The folder no longer exists.")
        ]);
        expect(useCases.folderExists).toHaveBeenCalledTimes(1);
    });

    it("renumbers and recounts when a rule is deleted", async () => {
        const { presenter } = await openWith([RULE_PLAIN, RULE_DELETED_FOLDER]);
        await vi.waitFor(() => {
            expect(cardOf(presenter).warnings).toEqual([
                warningLine("Rule 2: The folder no longer exists.")
            ]);
        });

        presenter.updateStep("step-1", { config: peopleConfig([RULE_DELETED_FOLDER]) });

        expect(cardOf(presenter).warnings).toEqual([
            warningLine("Rule 1: The folder no longer exists.")
        ]);
        expect(cardOf(presenter).summary).toBe(
            "Editors · Round-robin · 1 routing rule · requester can pick"
        );
    });

    it("shows no warning for a folder the admin cannot see (restricted)", async () => {
        const setup = createEditorPresenterSetup();
        const step = createReviewStep({ config: peopleConfig([RULE_DELETED_FOLDER]) });
        setup.useCases.getWorkflow.mockResolvedValue(createEditorWorkflow({ steps: [step] }));
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);
        await setup.presenter.init(setup.params);

        await vi.waitFor(() => {
            expect(setup.useCases.folderExists).toHaveBeenCalledTimes(1);
        });

        expect(cardOf(setup.presenter).warnings).toEqual([]);
    });

    it("lists the live error of a rule without a target as an error line before any Save", async () => {
        const { presenter } = await openWith([RULE_NO_TARGET]);

        expect(cardOf(presenter).warnings).toEqual([
            errorLine("Rule 1: Choose who this rule assigns to.")
        ]);
        expect(cardOf(presenter).error).toBeNull();
    });

    it("shows the strip after a blocked Save and does not repeat it as a line", async () => {
        const { presenter, useCases } = await openWith([RULE_NO_TARGET]);
        presenter.setName("Article review v2");

        await presenter.save();

        expect(useCases.storeWorkflow).not.toHaveBeenCalled();
        expect(cardOf(presenter).error).toBe("Rule 1: Choose who this rule assigns to.");
        expect(cardOf(presenter).warnings).toEqual([]);
    });

    it("shows the teams-off line and an empty summary for a People step of an unavailable review row", async () => {
        const setup = createEditorPresenterSetup();
        setup.config.listStepTypes.mockResolvedValue([
            createEditorStepType({
                type: "review",
                title: "Review",
                available: false,
                unavailableReason: "Teams are not enabled."
            }),
            createEditorStepType({ type: "automation", title: "Automation" }),
            createEditorStepType({ type: "ai", title: "AI" })
        ]);
        const rules = [
            { id: "r1", conditions: {}, target: { type: "user", id: "user-9" } },
            RULE_DELETED_FOLDER
        ];
        const step = createReviewStep({ config: peopleConfig(rules) });
        setup.useCases.getWorkflow.mockResolvedValue(createEditorWorkflow({ steps: [step] }));
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(false);

        await setup.presenter.init(setup.params);

        const card = cardOf(setup.presenter);
        expect(card.summary).toBe("");
        expect(card.warnings).toEqual([
            warningLine("This step needs teams, which are not enabled. It can't be edited.")
        ]);
        expect(card.readOnly).toBe(true);
        expect(card.error).toBeNull();
        expect(setup.config.listTeams).not.toHaveBeenCalled();
        expect(setup.config.listUsers).not.toHaveBeenCalled();
    });
});
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/StepCard.test.tsx`. Add the import after the `StepCardVm` import:

```tsx
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
```

Replace the 9a warning-lines case:

Before:
```tsx
        const warnings = [
            "Legal has no members.",
            "The automation “Send webhook” no longer exists."
        ];
```
After:
```tsx
        const warnings: StepWarningLine[] = [
            { text: "Legal has no members.", severity: "warning" },
            { text: "The automation “Send webhook” no longer exists.", severity: "warning" }
        ];
```

Then add the new cases at the end of the `describe`. The last lines of the file are:

Before:
```tsx
        expect(screen.getByText("Custom check")).toBeTruthy();
    });
});
```
After:
```tsx
        expect(screen.getByText("Custom check")).toBeTruthy();
    });

    it("shows the People summary and the rule lines with their numbers", () => {
        const step: StepCardVm = {
            ...STEP,
            summary: "Legal + Editors · Round-robin · 2 routing rules · requester can pick",
            warnings: [
                { text: "Rule 1: Choose who this rule assigns to.", severity: "error" },
                { text: "Rule 2: The folder no longer exists.", severity: "warning" }
            ]
        };
        renderWithAdminUi(<StepCard {...createProps({ step })} />);

        expect(
            screen.getByText("Legal + Editors · Round-robin · 2 routing rules · requester can pick")
        ).toBeTruthy();
        expect(screen.getByText("Rule 1: Choose who this rule assigns to.")).toBeTruthy();
        expect(screen.getByText("Rule 2: The folder no longer exists.")).toBeTruthy();
    });

    it("draws a live error line destructive and a warning line amber, without an alert or a red border (R299)", () => {
        const step: StepCardVm = {
            ...STEP,
            warnings: [
                { text: "Rule 1: The assigned user was deleted.", severity: "error" },
                { text: "Rule 2: The folder no longer exists.", severity: "warning" }
            ]
        };
        renderWithAdminUi(<StepCard {...createProps({ step })} />);

        const error = screen.getByText("Rule 1: The assigned user was deleted.");
        const warning = screen.getByText("Rule 2: The folder no longer exists.");
        const errorRow = error.closest("[data-severity]");
        const warningRow = warning.closest("[data-severity]");
        expect(errorRow?.getAttribute("data-severity")).toBe("error");
        expect(errorRow?.className).toContain("text-destructive-primary");
        expect(warningRow?.getAttribute("data-severity")).toBe("warning");
        expect(warningRow?.className).not.toContain("text-destructive-primary");
        expect(screen.queryByRole("alert")).toBeNull();
        expect(cardOf("step-2").className).not.toContain("border-destructive-default");
    });

    it("shows a rule error strip and the teams-off line on a read-only step", () => {
        const step: StepCardVm = {
            ...STEP,
            readOnly: true,
            summary: "",
            warnings: [
                {
                    text: "This step needs teams, which are not enabled. It can't be edited.",
                    severity: "warning"
                }
            ],
            error: "Rule 1: The target user is not a member of the step's teams."
        };
        renderWithAdminUi(<StepCard {...createProps({ step })} />);

        expect(
            screen.getByText("This step needs teams, which are not enabled. It can't be edited.")
        ).toBeTruthy();
        expect(screen.getByRole("alert").textContent).toBe(
            "Rule 1: The target user is not a member of the step's teams."
        );
        expect(screen.getByText("Read-only")).toBeTruthy();
        expect(cardOf("step-2").className).toContain("border-destructive-default");
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/omitShownError.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.cards.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/components/StepCard.test.tsx 2>&1 | tail -30
```

Expected: `omitShownError.test.ts` fails with `Failed to resolve import "./omitShownError.js"`. In `buildStepCardVm.test.ts` the three strip cases fail (`card.warnings` still holds every line). In `WorkflowEditorPresenter.cards.test.ts` the strip case fails only if Task 12 and Task 15 leave the live error line in place (it does: the card does not drop it yet); the other cases pass when Tasks 12, 14, 15 and 16 are in. If a summary or a `Rule {n}:` line is missing, `getStepContext` does not pass the resolved `references` or `reviewAvailable` (Tasks 12 and 14): fix that there, not here. In `StepCard.test.tsx` the destructive-line case fails (no `data-severity` row). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/ShownCardError.ts`:

```ts
// The error the card strip shows, as `buildStepCardVm` composes it (R303).
export interface ShownCardError {
    // The strip text, `Rule {n}: {message}` for a rule error.
    text: string;
    // `Rule {n}: ` when the strip is a rule's error, else null.
    rulePrefix: string | null;
}
```

Create `packages/app-workflows/src/editor/presentation/editor/omitShownError.ts`:

```ts
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { ShownCardError } from "./ShownCardError.js";

/*
 * The card's lines without what the strip already says (R299, R303): the line identical to the
 * strip text, and, when the strip is a rule's error, the live `error` lines of that rule (the strip
 * is the rule's current error, so a live line worded differently does not double it). A `warning`
 * line of that rule and the lines of other rules stay.
 */
export const omitShownError = (
    lines: StepWarningLine[],
    shown: ShownCardError | null
): StepWarningLine[] => {
    if (shown === null) {
        return lines;
    }
    return lines.filter(line => {
        if (line.text === shown.text) {
            return false;
        }
        if (shown.rulePrefix !== null && line.severity === "error") {
            return !line.text.startsWith(shown.rulePrefix);
        }
        return true;
    });
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`.

Before (top of the file; keep the other imports):
```ts
export interface StepCardVm {
```
Add the import at the top of the import block:
```ts
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
```
and in `StepCardVm`:

Before:
```ts
    readOnly: boolean;
    warnings: string[];
    // The first client or server error of the step, shown as the card strip, or null.
```
After:
```ts
    readOnly: boolean;
    // The step and rule lines with their severity: an `error` line is a live rule error (R299).
    warnings: StepWarningLine[];
    // The first client or server error of the step, shown as the card strip, or null.
```

Modify `packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.ts` (against the file as Task 15 leaves it: its `StepCardParams` has `ruleIds`, and the `firstError` block computes `error`).

Hunk A, imports:

Before:
```ts
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { StepCardVm } from "./abstractions.js";
```
After:
```ts
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { StepCardVm } from "./abstractions.js";
import { omitShownError } from "./omitShownError.js";
import type { ShownCardError } from "./ShownCardError.js";
```

Hunk B, the params:

Before:
```ts
    warnings: string[];
```
After:
```ts
    warnings: StepWarningLine[];
```

Hunk C, the strip text (Task 15's block):

Before:
```ts
    let error: string | null = null;
    if (firstError !== null) {
        error = firstError.message;
        const position = params.ruleIds.indexOf(firstError.ruleId ?? "");
        if (firstError.ruleId !== null && position !== -1) {
            error = `Rule ${position + 1}: ${firstError.message}`;
        }
    }
```
After:
```ts
    let error: string | null = null;
    let rulePrefix: string | null = null;
    if (firstError !== null) {
        error = firstError.message;
        const position = params.ruleIds.indexOf(firstError.ruleId ?? "");
        if (firstError.ruleId !== null && position !== -1) {
            rulePrefix = `Rule ${position + 1}: `;
            error = `${rulePrefix}${firstError.message}`;
        }
    }
    let shown: ShownCardError | null = null;
    if (error !== null) {
        shown = { text: error, rulePrefix };
    }
```

Hunk D, the returned object:

Before:
```ts
        warnings: params.warnings,
        error,
```
After:
```ts
        warnings: omitShownError(params.warnings, shown),
        error,
```

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts` (`buildFlow`, as Task 12 leaves it).

Before:
```ts
            const warningLines = getStepWarnings(step, context);
            const warnings = warningLines.map(line => line.text);

            return buildStepCardVm({
                step,
                index,
                count,
                typeLabel: getStepTypeLabel(step.type, stepTypes),
                summary: getStepSummary(step, context),
                warnings,
```
After:
```ts
            return buildStepCardVm({
                step,
                index,
                count,
                typeLabel: getStepTypeLabel(step.type, stepTypes),
                summary: getStepSummary(step, context),
                warnings: getStepWarnings(step, context),
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/StepCard.tsx`.

Imports, after the `EditIcon` import:

Before:
```tsx
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
```
After:
```tsx
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
```

The lines (an `error` line is a live rule error, drawn destructive; it is not an alert, the strip is):

Before:
```tsx
            {step.warnings.map((warning, warningIndex) => (
                <div
                    key={`${warningIndex}:${warning}`}
                    className="flex items-start gap-xs text-sm text-neutral-primary"
                >
                    <Icon
                        icon={<WarningIcon />}
                        label="Warning"
                        size="sm"
                        className="fill-warning"
                    />
                    <span>{warning}</span>
                </div>
            ))}
```
After:
```tsx
            {step.warnings.map((line, lineIndex) => {
                const isError = line.severity === "error";
                const rowClass = cn(
                    "flex items-start gap-xs text-sm",
                    isError ? "text-destructive-primary" : "text-neutral-primary"
                );
                return (
                    <div
                        key={`${lineIndex}:${line.text}`}
                        data-severity={line.severity}
                        className={rowClass}
                    >
                        <Icon
                            icon={isError ? <ErrorIcon /> : <WarningIcon />}
                            label={isError ? "Error" : "Warning"}
                            size="sm"
                            className={isError ? "fill-destructive" : "fill-warning"}
                        />
                        <span>{line.text}</span>
                    </div>
                );
            })}
```

Confirm, without editing: `getStepContext` in `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts` ends with `references: this.getReferences()` and `reviewAvailable: isReviewAvailable(this.stepTypes.items)` (Task 12 added the second, Task 14 the first), and `buildFlow` passes `warnings: getStepWarnings(step, context)` (the hunk above) and Task 15's `ruleIds: getStepRuleIds(step)`. If any is missing, an earlier task is incomplete: report it instead of patching it here. Also run `grep -rn "warnings: \[\"" packages/app-workflows/src --include=*.ts --include=*.tsx` and make sure no card-VM literal still carries a string array (Task 12 adjusts the presenter tests that compare `flow.steps[n].warnings`; fix any left over the same way, `{ text, severity: "warning" }`).

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/omitShownError.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.cards.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/components/StepCard.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: (1) the reference lookups are asynchronous, so the presenter cases wait with `vi.waitFor`; the reorder and delete cases update the step synchronously and read the card at once, because the reference maps already hold folder `f1`. (2) The blocked-Save case needs the draft to be dirty: `setName` does that; the strip text is Task 15's `Rule 1: ` plus the client message. (3) In the teams-off case the `review` row is unavailable, so `getStepWarnings` returns the one line of R309 and no rule line; the test expects its severity to be `warning`, change it if Task 12 chose `error` for that line.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/model 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, including `WorkflowFlow.test.tsx` and `WorkflowFlowLayout.*` (move and drag unchanged); no TypeScript errors in `app-workflows`.

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
git commit -m "feat(app-workflows): show the People summary and rule lines on the step card" -m "A People card shows the strategy, rule count and requester pick in its summary, the rule warnings and live rule errors prefixed with the rule's current number, and the teams-off line. A line the strip already shows is not repeated. Tests cover a card edited and then reordered, a deleted rule, a restricted folder and a People step of an unavailable review row." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Severity (consistency ruling).** R299 asks for destructive live errors on the card. `getStepWarnings` (Task 12) now returns `{ text, severity }` lines, `StepCardVm.warnings` carries them and `StepCard.tsx` draws an `error` line destructive. This replaces the earlier plan to leave `StepCard.tsx` unchanged; the card VM and its two test files change instead of the presenter.
- **A server error replaces the live error of its rule on the card.** The strip is the first step error only, so the card drops the live `error` lines of the strip's own rule (and the identical line), as the drawer does (Task 16). A server error on a second rule is shown in the drawer, and the live line of that rule stays on the card until it is the strip.
- **`StepWarningLine` path** (`~/editor/model/StepWarningLine.ts`) is the one Task 12 is expected to create; the drawer chrome (Task 23) imports it too.
- **`buildStepCardVm.ts`** is also edited by Task 15 (the strip text and `ruleIds`); the hunks here assume Task 15's block verbatim.
- **No presenter change here.** Task 12 passes `references` and `reviewAvailable` in `getStepContext` and Task 14 swaps in the resolved references; this task only proves the result on the card.
- **`StepFieldError.ruleId`** is optional until Task 15 makes it `string | null`; the new `buildStepCardVm` cases set it explicitly, which is valid in both states.
- Size: small to medium (one pure helper with its type, a card VM hunk, one render hunk in `StepCard`, tests for the chain).

## Review fixes (sub-phase review)

- Severity ruling applied: `StepCardVm.warnings` is `StepWarningLine[]`, `StepCard.tsx` draws live rule errors destructive (new hunk, new tests), the 9a card tests that compare warnings are converted to lines.
- Server error replaces the live error of its rule on the card: `omitShownError(lines, shown)` with `ShownCardError { text, rulePrefix }` drops the identical line and the live error lines of the strip's rule; the "Residual double line" note is gone.
- The `buildStepCardVm` strip test now sets `ruleIds` (Task 15's `Rule {n}: ` prefix needs it; with the default `[]` the old test expected a text the card could not produce).
- Hunks written against Task 15's `firstError` / `error` block; the confirm step also checks `buildFlow` passes Task 15's `ruleIds`; the `buildFlow` hunk assumes Task 12's text (`warningLines` / `warnings`).
