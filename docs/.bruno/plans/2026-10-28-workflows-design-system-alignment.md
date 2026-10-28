# Workflows UI: design system alignment (Sven's feedback, batch 1)

**Goal:** remove every bespoke style from the workflows apps and build their UI from admin-ui components and their existing variants and props only. Fix the AI tool copy Sven called too technical. Rebuild the workflow editor's step list on the admin-ui `Accordion`.

**Spec:** Sven's feedback (2026-10-28) and the user's rulings in this file. The Claude Design frames (`docs/.bruno/workflows/design/files`) are reference only: **where a frame differs from the design system, the design system wins.**

**Audit:** `docs/.bruno/plans/2026-10-28-workflows-design-system-audit.txt` lists every non-layout class found in `packages/app-workflows`, `packages/app-headless-cms-workflows` and `packages/app-website-builder-workflows` (`.tsx`, tests excluded). Each task owns the audit lines of its files.

## Global Constraints

- Branch: `bruno/fix/workflows-sven-feedback` (merges into #6079 later). Never push, never deploy, never amend.
- Never change `@webiny/admin-ui`, `app-admin`, `app-headless-cms`, `app-website-builder` or `api-headless-cms`.
- **No styling in workflows code.** Not allowed in class names: colours (`bg-*`, `text-<colour>`, `fill-*`, `stroke-*`), borders (`border*`, `divide-*`), radius (`rounded*`), shadows, rings, opacity, font size and weight, `leading-*`, `tracking-*`, `uppercase`, and any arbitrary value `[...]` (including `w-[380px]`, `ml-[42px]`, `text-[12px]`, `[&_label]:…`). Allowed: layout utilities only — `flex`/`grid`/`items-*`/`justify-*`/`self-*`, `gap-*`, `p-*`/`m-*` with design-system spacing tokens, `w-full`/`h-full`/`min-w-0`/`truncate`/`overflow-*`, `sr-only`, and positioning.
- Typography comes from `Text`/`Heading` props (`size`, `as`, and colour props if the component has them). Colour, border, surface and elevation come from component variants (`Card`, `Tag`, `Alert`, `Button`, `Separator`, `List`, `DataList`, `Skeleton`, `EmptyState`, `Widget`, `Avatar`, `Icon` props, …).
- **Step colour is data, not styling.** The user-chosen step colour may still be shown. Prefer an admin-ui component that accepts a colour. Where none does, a minimal inline `style={{ backgroundColor: color }}` on a layout-only element is allowed. It still never sets `backgroundColor: undefined`; a missing colour renders no element.
- If admin-ui cannot express something a frame shows, drop it and add one line to "Design deviates" at the bottom of this file. Never add a style.
- One abstraction or implementation per file; no `Impl` suffix; no inline object types. Copy uses “ ” and … exactly.
- Tests: assertions on removed Tailwind classes are deleted or replaced by behaviour or structure assertions (role, text, order, which admin-ui component renders). Do not assert admin-ui's internal classes. Run tests one file or folder at a time, never in parallel: `yarn test <path> 2>&1 | tail -30`.
- Before each commit: `yarn format:fix`, `yarn lint:fix`, `yarn adio`, `node scripts/generateTsConfigsInPackages.js`, `yarn build -p <changed package>`. If a step fixes something, rerun the chain.
- Commits: Conventional Commits, scope = package, one per package, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Rulings (user, 2026-10-28)

- Layout utilities are allowed; everything else comes from admin-ui.
- The step list in the workflow editor becomes an admin-ui `Accordion`. The drawn connector lines, the round "+" connector buttons and the Draft/Published end cards go away. "Add step" becomes an admin-ui `Button` after the list (and the empty state's primary action).
- Step colour stays as data (see the Global Constraints).

---

### Task 1: User-facing AI tool titles and descriptions (Sven: "Read target / Update target too technical")

**Files:** `packages/api-workflows/src/features/aiTools/WorkflowAiTool/abstractions.ts`, `ReadTargetTool/ReadTargetTool.ts`, `UpdateTargetFieldsTool/UpdateTargetFieldsTool.ts`, the `listAiTools` GraphQL type and resolver in api-workflows, the app gateway and type that read tools, and the AI step form tools renderer in `packages/app-workflows/src/editor/presentation/stepForm`. Find them with `codegraph explore "listAiTools WorkflowAiTool"`.

- The existing `title` and `description` stay the model-facing tool contract and are sent to the LLM unchanged.
- Add a user-facing `label: string` and `summary: string` to `WorkflowAiTool.Interface`. Expose them through `listAiTools` as `label` and `summary`. The editor shows `label` and `summary` only; `description` is never shown in the admin.
- Copy (from the design, verbatim):
  - read target: label `Read fields`, summary `Reads every field of the revision under review.`
  - update target fields: label `Update fields`, summary `Edits field values in the revision under review.`
- Under the tools list, keep or add the design note as a muted `Text`: `Tools marked “Changes content” can edit the revision while it is in review. The editor reloads and tells the author when that happens.`
- Render the tool rows as admin-ui `CheckboxGroup` / `Checkbox` with their label and description props, or a `List`. No custom border box.
- Tests: the api schema test exposes `label` and `summary`; the renderer shows `Read fields`, `Reads every field of the revision under review.`, and not the model-facing text.
- Commits: `fix(api-workflows): give AI tools a user-facing label and summary` and `fix(app-workflows): show AI tools by their user-facing label and summary`.

### Task 2: Workflow editor step list as an admin-ui Accordion (Sven: step visuals; "use our standard accordion")

**Files:** `editor/presentation/editor/components/WorkflowFlow.tsx`, `StepCard.tsx`, `EditorLoading.tsx`, and their tests. The audit lines are for these files.

- Each step is one `Accordion` item. The header shows the step number, the title, the step type `Tag`, and the meta line (strategy, team, or model). Edit, move up, move down and delete are the item's actions, using whatever the Accordion item offers for actions; otherwise use ghost `IconButton`s in the header's action slot. Keep the existing `aria-label`s.
- Expanding an item shows the step's description and its warnings and error lines. Warnings and errors use admin-ui `Alert` or `Text` with the component's own variants, never custom colour classes.
- Remove the connector lines, the round connector "+" buttons and the Draft/Published end cards. "Add step" is one admin-ui `Button` (`add` icon) after the list. The empty state ("No steps yet" + `Add the first step: who or what reviews {model} content before it can be published.`) uses `EmptyState` with that button as its action.
- Moving and inserting keep their current behaviour (presenter API unchanged). Inserting at a position, which the connector "+" used to do, is replaced by "Add step" appending at the end, plus move up and down.
- The step colour circle or dot follows the step colour data rule.
- `EditorLoading` uses `Skeleton` only.
- Tests: update `WorkflowFlow.test.tsx` and `StepCard.test.tsx`. Assert the item order, the title, type tag and meta per item, actions by `aria-label`, Add step at the end, and the empty state copy. Delete the connector and class assertions.
- Commit: `fix(app-workflows): show workflow steps as an admin-ui accordion`.

### Task 3: Editor header, model panel, step type picker and blocked-delete list

**Files:** `EditorHeader.tsx`, `ModelPanel.tsx`, `StepTypePicker.tsx`, `dialogs/BlockedDeleteDialog.tsx` (audit lines).

- Header: admin-ui `EditableTitle` as it renders (its own look is the design system). Remove every class wrapper styling. The subtitle and the "Changes apply…" hint are `Text` with props only. Keep the keyboard trigger (`role="button"`, Enter and F2) as layout only. The "Untitled workflow" placeholder is `Text` with a muted prop if `Text` has one; otherwise plain text.
- Model panel: the list of models is admin-ui `List` (or `DataList`) items with the model icon, name and the "N steps" / "No workflow" description. The "has a workflow" icon goes through `Icon` props. The search `Input` keeps its start icon. The no-match text is `Text` with props.
- Step type picker: the three types are admin-ui `RadioGroup` cards if the component has a card variant; otherwise a `List` of selectable items. Disabled reasons use `Text` and the lock `Icon`. No custom fills or grid styling beyond layout.
- Blocked delete list: admin-ui `List` with one item per review and an `open_in_new` icon link.
- Commit: `fix(app-workflows): build the editor header, model panel and pickers from admin-ui`.

### Task 4: Step form renderers (Sven: colour selector)

**Files:** `stepForm/renderers/StepColourRenderer.tsx`, `RequesterPickRenderer.tsx`, `AutomationCardsRenderer.tsx`, `assignmentStrategy/StrategyCardLabel.tsx`, `routingRules/*` (`RoutingRulesList`, `RuleSummary`, `RuleWarnings`, `RulesEmptyNote`), `AiModelPickerRenderer.tsx`, `TestRoutingRenderer.tsx`, `testRouting/TestRoutingResult.tsx`, `stepDrawer/StepDrawer.tsx` (audit lines).

- Colour: the preset swatches and the custom colour use admin-ui `ColorPicker`, with presets if it supports them. If it has no presets, use a `ColorPicker` for the custom colour next to whatever admin-ui offers for a set of options (`ToggleGroup`/`RadioGroup`). The hex input is the ColorPicker's own, or an admin-ui `Input`. No hand-made swatch buttons.
- Requester pick: `Switch` with its own `label` and `description` props. No `[&_label]` variants and no `ml-[42px]`.
- Strategy and automation cards: admin-ui `RadioGroup` (card variant if it exists) or `List`.
- Routing rules: rows as `List`/`DataList`, warnings as `Alert` variants, the empty note as `Text`/`Alert`.
- Test routing result: one admin-ui `Card`. The owner band uses `Avatar` (person) or `Icon` (team) plus `Text`/`Heading`. Trace and skipped people are `DataList` or `List`. Section headings use `Heading`/`Text` props, not `uppercase` classes. The stale alert stays `Alert type="warning"`.
- Section dividers between people-step sections use admin-ui `Separator`. No border classes.
- Commit: `fix(app-workflows): build the step form from admin-ui components`.

### Task 5: Review bar, steps popover and progress

**Files:** `review/presentation/targetReview/components/ReviewBar.tsx`, `ReviewBarSkeleton.tsx`, `ReviewBarFailed.tsx`, `ReviewStepsPopover.tsx`, `ReviewProgress.tsx`, `reviewBarAppearance.ts`, `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx` (audit lines).

- Remove `REVIEW_TILE_CLASSES` and every fill and background class. The state tile is an admin-ui `Icon` (or `Avatar`) with its own colour or variant prop if it has one; otherwise a plain icon.
- Progress: admin-ui `SteppedProgress` or `ProgressBar` if either fits approved/total plus segments. Otherwise `Text` ("4 of 5 steps approved") with the per-step segments dropped (design deviates). The progress row divider is a `Separator`.
- Popover: `Popover` content as a `List` of steps (step colour dot per the data rule, title, `Text` description, state `Tag`, owner `Text`, comment as plain `Text` in quotes). No fixed width class, no quote box background.
- Skeleton: `Skeleton` only. The WB strip layout keeps layout utilities only.
- Commit(s): `fix(app-workflows): build the review bar and steps popover from admin-ui`; `fix(app-website-builder-workflows): …` if `PageReviewBar` changes.

### Task 6: Review details drawer (Sven: "very noisy")

**Files:** `review/presentation/reviewDetails/components/ReviewDetailsDrawer.tsx`, `ReviewDetailsSkeleton.tsx`, `ReviewStepRunPanel.tsx`, `ReviewStepCircle.tsx` (audit lines).

- Strip every style class. Each step is an admin-ui `Accordion` item (the same component as the editor, for consistency). Only the current or last-decided step is expanded by default, and the others are collapsed. This is the noise reduction: owner, why-this-owner, times, comment, issues and attempts appear only when a step is expanded.
- Inside an item: `DataList` for owner, why-this-owner and times; the comment as `Text` in quotes; AI issues as a `List` with a severity `Tag`; attempts as a `List`.
- The header keeps the eyebrow, title, state `Tag` and the content, requester and requested line, using `Text`/`Heading` props.
- Cancelled state: keep `EmptyState`.
- `ReviewStepCircle` becomes an `Icon` per state (the step colour per the data rule).
- Tests: update the drawer tests. Assert default expansion (current step open, others closed) and that the content of a collapsed step is not visible.
- Commit: `fix(app-workflows): show review details steps as a collapsible admin-ui accordion`.

### Task 7: Request, reassign and action dialogs, pickers

**Files:** `requestReview/components/RequestReviewDialog.tsx`, `actionDialog/components/ReassignDialog.tsx`, `reviewerPicker/components/renderReviewerOption.tsx`, `components/picker/renderPickerOption.tsx` (audit lines).

- The step list in the request dialog is a `List` (or `DataList`) with the step number, title, `Text` description, and `Tag` for the type and owner (both admin-ui `Tag` variants). No custom border box or divider classes.
- Picker options: `Avatar` plus `Text` with props. No size or colour classes.
- Commit: `fix(app-workflows): build the review dialogs and pickers from admin-ui`.

### Task 8: Content Reviews list, toolbar and dashboard widgets

**Files:** `reviewList/components/ReviewListView.tsx`, `ReviewListToolbar.tsx`, `ReviewListTable.tsx`, `reviewWidget/components/ReviewWidgetCard.tsx`, `ReviewWidgetRow.tsx` (audit lines).

- Table: admin-ui `Table`/`DataTable` as is. Cells use `Text` props (the app line is muted `Text`, not `text-[12px]`).
- Toolbar: the select widths are layout only (`w-*` from the spacing scale if allowed by the boundary, else none); no arbitrary widths.
- Page frame: the `mx-auto max-w-[1180px]` arbitrary value goes. Use what admin-ui offers for a page container if anything, else layout only.
- Widgets: `Widget` as is; rows as `List` items. The title is plain `Widget` title typography, with no span styling.
- Commit: `fix(app-workflows): build Content Reviews and widgets from admin-ui as is`.

### Task 9: Settings pages and role permissions

**Files:** `settings/presentation/exclusionsPage/components/*` (`ExclusionsTable`, `ExclusionsRulesCard`, `ExclusionsLoading`, `ExclusionsToolbar`, `ExclusionsPage`, `ExclusionsHeader`), `exclusionDialog/components/ExclusionDialog.tsx`, `presentation/permissions/WorkflowsRolePermissions.tsx` (audit lines).

- Same rules: `Table`, `Card`, `Skeleton`, `Heading`/`Text` props, `Alert`; no arbitrary widths.
- Commit: `fix(app-workflows): build the workflows settings pages from admin-ui as is`.

### Task 10: Sweep

- Re-run the audit script on the three app packages, including `.ts` files and class-name constants. It must report nothing except allowed layout utilities and the step-colour inline style. Fix stragglers in the owning package. Remove now-unused class constants and helpers.
- Commit per package: `fix(<package>): remove the remaining bespoke styles`.

## Design deviates (filled in during the run)

Any frame detail admin-ui cannot express is listed here, one line each, instead of being styled.
