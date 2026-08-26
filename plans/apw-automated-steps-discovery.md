# Discovery: Automated Steps for Advanced Publishing Workflows

**Status:** read-only investigation. No implementation code, branch, commit or PR was produced.
**Branch read:** `feat/notifications` (commit `a684f65879`), inspected via a detached worktree so the
working tree was left untouched.
**Method:** Webiny MCP server (`get_started`, then the `webiny-api-architect`,
`webiny-use-case-pattern`-adjacent, `webiny-cms-bulk-actions`, `webiny-api-tasks-catalog`,
`webiny-ai-powerups-content`, `webiny-form-model` and `webiny-admin-permissions` skills) for
conventions; direct source reading for facts.

## Branch delta vs `next`

`git diff --name-only next...feat/notifications` touches only:

- **New packages:** `api-collaboration`, `api-notifications`, `api-notifications-integrations`,
  `app-collaboration`, `app-notifications`.
- **`@webiny/app-admin` form model** — `IFieldVM` gains `qualifiedName`
  (`packages/app-admin/src/features/formModel/abstractions.ts`):

  ```ts
  export interface IFieldVM {
      name: string;
      /** Full dotted path of the field within the form (e.g. "author.address.street"). */
      qualifiedName: string;
  ```

  This is the field-anchoring primitive the comments UI depends on. **It does not exist on `next`.**
- Registration/packaging only: `app-serverless-cms/src/Admin.tsx`, `cli/files/references.json`,
  `project-aws/_templates/**`, `yarn.lock`.

**Everything in APW, Headless CMS, background tasks, AI and audit logs is identical between
`feat/notifications` and the merge base with `next`.** No behavioural difference to report in those
areas.

## Terminology map (important — the brief's vocabulary is not the code's)

| Brief | Code |
|---|---|
| workflow | `IWorkflow`, CMS model `wbyWorkflow` |
| step | `IWorkflowStep` |
| **content review** | **workflow state** — `IWorkflowStateRecord` / `WorkflowState`, CMS model `wbyWorkflowState` |
| sign-off | `approveWorkflowStateStep` mutation → `WorkflowState.approve()` |
| **comment** | **collaboration thread** — `ICollabThread`, CMS model `wbyCollabThread`; individual comments are `ICollabMessage` inside `thread.messages` |
| "APW" in audit-log config | legacy v5 naming, unused (see Area 7) |

There is no package named `api-apw`. The feature lives in six packages:
`api-workflows`, `app-workflows` (core), `api-headless-cms-workflows`,
`app-headless-cms-workflows` (CMS binding), `api-website-builder-workflows`,
`app-website-builder-workflows` (WB binding, out of scope).

---

# Area 1: Workflow and step entities

## 1.1 Where are the workflow and step entities defined?

`packages/api-workflows/src/domain/workflow/abstractions.ts`:

```ts
export interface IWorkflowStepNotification {
    id: string;
}

export interface IWorkflowStepTeam {
    id: string;
}

export interface IWorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    teams: NonEmptyArray<IWorkflowStepTeam>;
    notifications?: IWorkflowStepNotification[];
}

export interface IWorkflowValues {
    app: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStep>;
}

export interface IWorkflow extends IWorkflowValues {
    id: string;
}
```

Storage is a **private** CMS model, `packages/api-workflows/src/domain/workflow/workflowModel.ts`:

```ts
builder
    .private({ modelId: WORKFLOW_MODEL_ID, name: "Workflow" })
    .fields(fields => ({
        name: fields.text().label("Name").required("Workflow name is required."),
        app: fields.text().label("App").required("App is required."),
        steps: fields
            .object()
            .label("Steps")
            .list()
            .required("Steps are required.")
            .listMinLength(1, "At least one step is required.")
            .fields(fields => ({
                id: fields.text().label("ID").required("ID is required."),
                title: fields.text().label("Title").required("Title is required."),
                color: fields.text().label("Color"),
                description: fields.text().label("Description"),
                teams: fields.object().label("Teams").list().fields(teamFields => ({
                    id: teamFields.text().label("ID").required("ID is required.")
                })),
                notifications: fields.object().list().label("Notifications").fields(fields => ({
                    id: fields.text().label("Id").required("Id is required.")
                }))
            }))
    }))
```

`packages/api-workflows/src/constants.ts`:

```ts
export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const WORKFLOW_STATE_MODEL_ID = "wbyWorkflowState";
export const WORKFLOWS_PERMISSION = "workflows";
```

Client-side mirror: `packages/app-workflows/src/types.ts` (`IWorkflowStep`, identical shape) and
`packages/app-workflows/src/domain/WorkflowStepModel.ts` (MobX model).

`app` is a namespace string. For CMS it is `cms.<modelId>`
(`packages/api-headless-cms-workflows/src/utils/appName.ts`):

```ts
export const createWorkflowAppName = ({ model }: IParams): string => {
    return `cms.${model.modelId}`;
};
```

**Only one workflow per app is supported.** `CreateWorkflowStateUseCase` lists with `limit: 1` and
fails if `meta.totalCount > 1` with `MultipleWorkflowsFoundError`.

## 1.2 How are steps stored and ordered?

As an **ordered array** in the `steps` object-list field on the workflow entry. There is no explicit
`order`/`position` field — array index *is* the order. `id` is the step identity (client-generated,
`mdbid`-style, set by the admin editor).

Reordering is pure array manipulation in the admin presenter
(`packages/app-workflows/src/presentation/workflowsEditor/WorkflowsEditorPresenter.ts` →
`moveStepUp` / `moveStepDown` / `canMoveStepUp` / `canMoveStepDown`), then the whole workflow is
re-saved via `storeWorkflow`. There is no partial-step mutation.

Sequence navigation on the state side is also index-based
(`packages/api-workflows/src/domain/workflowState/WorkflowState.ts`):

```ts
get nextStep(): IEnrichedWorkflowStateRecordStep | null {
    const steps = this.steps;
    const currentStep = this.currentStep;
    const currentIndex = steps.findIndex(step => step.id === currentStep.id);
    if (currentIndex === -1) {
        return null;
    }
    return steps[currentIndex + 1] || null;
}
```

## 1.3 How is the mandatory / blocking classification expressed?

**It does not exist.** A case-insensitive grep for `mandatory|blocking|isBlocking|isMandatory|skippable`
across `api-workflows`, `app-workflows`, `api-headless-cms-workflows` and `app-headless-cms-workflows`
returns nothing.

Every step is implicitly **both** mandatory and blocking, by two mechanisms:

1. `WorkflowState.done` requires *all* steps approved:

   ```ts
   get done(): boolean {
       if (this.record.steps.length === 0) {
           return false;
       }
       return this.record.steps.every(step => {
           return step.state === WorkflowStateRecordState.approved;
       });
   }
   ```

2. Publishing requires `done` (Area 2.4).

There is also no notion of a step being skipped or optional in `WorkflowStateRecordState`:

```ts
export enum WorkflowStateRecordState {
    pending = "pending",
    inReview = "inReview",
    approved = "approved",
    rejected = "rejected"
}
```

## 1.4 What happens to existing workflows when the step shape changes?

**There is no migration mechanism for this data.** No migration package, script, or versioning field
exists for `wbyWorkflow` / `wbyWorkflowState`.

Adding an **optional** step property needs **no data migration** — the CMS stores object-list values
as-is and existing rows simply lack the key. Two supporting facts:

- Value cleanup is **top-level only**. `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateEntryDataFactory/CreateEntryDataFactory.ts`:

  ```ts
  const cleanInputValues = <TValues extends CmsEntryValues = CmsEntryValues>(
      model: CmsModel,
      input: TValues
  ) => {
      return model.fields.reduce<TValues>((acc, field) => {
          ...
          const key = field.fieldId as keyof TValues;
          const value = input[key] as TValues[keyof TValues];
          acc[key] = value === undefined ? (getDefaultValue(field) as TValues[keyof TValues]) : value;
          return acc;
      }, {} as TValues);
  };
  ```

  and `.../entryDataFactories/mapAndCleanUpdatedInputData.ts` does the same for updates. Neither
  recurses into object sub-fields, so nested unknown keys are **not** stripped by storage.
- Entry validation (`packages/api-headless-cms/src/crud/contentEntry/entryDataValidation.ts`)
  iterates the model's declared fields; it never rejects undeclared keys.

However, adding the field still requires **eleven code edits**, and every one of them silently drops
the value if missed:

| # | File | Why |
|---|---|---|
| 1 | `api-workflows/src/domain/workflow/abstractions.ts` | `IWorkflowStep` |
| 2 | `api-workflows/src/domain/workflow/workflowModel.ts` | CMS model sub-field (needed for filtering/validation) |
| 3 | `api-workflows/src/domain/workflowState/abstractions.ts` | `IWorkflowStateRecordStep extends IWorkflowStep` — inherits automatically |
| 4 | `api-workflows/src/domain/workflowState/stateModel.ts` | the state's own copy of the step sub-schema |
| 5 | `api-workflows/src/graphql/validation/step.ts` | **zod `.object()` strips unknown keys by default** |
| 6 | `api-workflows/src/graphql/workflows.ts` | `WorkflowStepInput` + `WorkflowStep` SDL |
| 7 | `api-workflows/src/graphql/workflowState.ts` | `WorkflowStateStep` SDL |
| 8 | `app-workflows/src/types.ts` | client `IWorkflowStep` |
| 9 | `app-workflows/src/domain/WorkflowStepModel.ts` | **`toJS()` is an explicit whitelist** |
| 10 | `app-workflows/src/features/graphqlFields.ts` | `WORKFLOW_FIELDS` / `WORKFLOW_STATE_STEP_FIELDS` are hand-written selection sets |
| 11 | `app-workflows/src/presentation/workflowsEditor/components/Editor/Step/Form/*` | editor UI |

The two silent-drop traps, quoted:

```ts
// api-workflows/src/graphql/validation/step.ts — zod strips anything not listed
export const stepValidation = zod.object({
    id: zod.string().min(1, "ID is required."),
    title: zod.string().min(1, "Title is required."),
    color: zod.string().min(1, "Color is required."),
    description: zod.string().nullish().optional().transform(value => value || undefined),
    teams: zod.array(zod.object({ id: zod.string().min(1, "Team ID is required.") }))
        .min(1, "You must select at least one team.")
        .transform(value => value as NonEmptyArray<IWorkflowStepTeam>),
    notifications: zod.array(zod.object({ id: zod.string().min(1, "Notification ID is required.") }))
        .nullish().optional().transform(value => value || undefined)
});
```

```ts
// app-workflows/src/domain/WorkflowStepModel.ts — explicit whitelist on save
public toJS(): IWorkflowStep {
    return toJS({
        id: this.id,
        title: this.title,
        color: this.color,
        description: this.description,
        teams: this.teams,
        notifications: this.notifications
    });
}
```

Tests that would need updating: `packages/api-workflows/__tests__/validation/step.test.ts`,
`validation/workflow.test.ts`, `WorkflowMapper.test.ts`, `graphql/workflows*.test.ts`,
`graphql/workflowStates*.test.ts`, `__tests__/mocks/workflow.ts`.

The two mappers pass `steps` through wholesale and would need no change:

```ts
// api-workflows/src/domain/workflow/WorkflowMapper.ts
fromCmsEntry(entry: CmsEntry<IWorkflowValues>): IWorkflow {
    const { id } = parseIdentifier(entry.id);
    return { id, app: entry.values.app, name: entry.values.name, steps: entry.values.steps };
}
```

## 1.5 Is there an existing per-step configuration payload?

**No.** A step carries only `id`, `title`, `color`, `description`, `teams`, `notifications`. There is
no `settings`, `config` or `data` field, and no JSON field on the step.

The nearest precedent is on the **workflow state**, not the step —
`targetContext` in `stateModel.ts`:

```ts
targetContext: fields.json().label("Target Context"),
```

populated by an injectable provider
(`api-workflows/src/features/workflowState/CreateWorkflowState/WorkflowStateContextProvider.ts`):

```ts
export interface IWorkflowStateContextProvider {
    provide(params: IWorkflowStateContextProviderParams): Promise<GenericRecord>;
}
```

which `api-headless-cms-workflows` decorates to add `{ folderId, modelId }`. This proves
`fields.json()` is an accepted pattern in this model, so a `config: fields.json()` on a step would
be idiomatic — but it is new, not existing.

---

# Area 2: Content review lifecycle

## 2.1 Where is the content review entity defined?

`packages/api-workflows/src/domain/workflowState/abstractions.ts`:

```ts
export interface IWorkflowStateIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface IWorkflowStateRecordStep extends IWorkflowStep {
    state: WorkflowStateRecordState;
    comment: string | null;
    savedBy: IWorkflowStateIdentity | null;
}

export interface IWorkflowStateRecord<
    Steps extends IWorkflowStateRecordStep = IWorkflowStateRecordStep
> {
    id: string;
    app: string;
    title: string;
    workflowId: string;
    targetId: string;
    targetRevisionId: string;
    isActive: boolean;
    comment: string | undefined;
    state: WorkflowStateRecordState;
    steps: Steps[];
    createdOn: Date;
    savedOn: Date;
    createdBy: IWorkflowStateIdentity;
    savedBy: IWorkflowStateIdentity;
    targetContext: GenericRecord;
}
```

The read model adds derived, per-caller data:

```ts
export interface IEnrichedWorkflowStateRecordStep extends IWorkflowStateRecordStep {
    isOwner: boolean;
    canTakeOver: boolean;
    canReview: boolean;
}

export interface IWorkflowState {
    // ... all IWorkflowStateRecord fields as readonly ...
    readonly steps: IEnrichedWorkflowStateRecordStep[];
    readonly done: boolean;
    readonly currentStep: IEnrichedWorkflowStateRecordStep;
    readonly nextStep: IEnrichedWorkflowStateRecordStep | null;
    readonly previousStep: IEnrichedWorkflowStateRecordStep | null;
}
```

Storage: `packages/api-workflows/src/domain/workflowState/stateModel.ts` (private model
`wbyWorkflowState`). `targetRevisionId` is a full revision id (`<entryId>#0001`); `targetId` is the
revision-less entry id.

## 2.2 What per-step state, and what statuses?

Persisted per step: `state`, `comment`, `savedBy`. `savedBy` doubles as "who claimed this step".

Statuses: `pending`, `inReview`, `approved`, `rejected` (`WorkflowStateRecordState`, mirrored in SDL
as `enum CmsEntryStateValue`). The **record** carries the same enum.

`canReview` / `isOwner` / `canTakeOver` are computed per request in
`WorkflowState.enrichStep` — this is the single most consequential function for the proposed feature:

```ts
private enrichStep(params: IEnrichStepWithPermissionParams): IEnrichedWorkflowStateRecordStep {
    const { step, createdBy } = params;
    const identity = this.currentIdentity;
    /**
     * User who created the workflow state cannot take part in reviewing it.
     */
    if (createdBy.id === identity.id) {
        return { ...step, isOwner: false, canTakeOver: false, canReview: false };
    }
    /**
     * Current user is step owner - they started the review.
     */
    const isOwner = step.savedBy?.id === identity.id;
    /**
     * Can current user actually review this step?
     */
    const canReview = step.teams.some(team => {
        return this.teams.some(t => t.id === team.id);
    });
    /**
     * Can current user take over the review from another reviewer?
     */
    const canTakeOver =
        canReview && !!step.savedBy?.id && step.state === WorkflowStateRecordState.inReview;

    return { ...step, canTakeOver: !isOwner ? canTakeOver : false, isOwner, canReview };
}
```

## 2.3 What causes a step to become active, and what code performs the transition?

**Nothing automatic. A human must explicitly start each step.** There is no scheduler, no
"activate next step" handler, and approving a step does not start the next one.

`startWorkflowStateStep(id: ID!)` → `StartWorkflowStateStepUseCase` → `WorkflowState.start()`:

```ts
start(): Result<void, WorkflowState.Error> {
    const stepResult = this.getPendingStep();
    if (stepResult.isFail()) {
        return Result.fail(stepResult.error);
    }
    const step = stepResult.value;
    if (!canReview(step)) {
        return Result.fail(new WorkflowStateStepCannotReviewError(step));
    }
    const identity = { id: this.currentIdentity.id, displayName: this.currentIdentity.displayName, type: this.currentIdentity.type };
    this.updateStep(step.id, { savedBy: identity, state: WorkflowStateRecordState.inReview });
    this.updateRecord({ savedBy: identity, state: WorkflowStateRecordState.inReview });
    return Result.ok();
}
```

`getPendingStep()` picks the **first** step whose state is `pending`, and refuses if the record is
`rejected` or already `inReview`.

On approval the record goes back to `pending`, and the next step stays `pending` until started:

```ts
approve(comment?: string): Result<void, WorkflowState.Error> {
    if (isRejected(this.record)) {
        return Result.fail(new WorkflowStateRejectedError(this.record));
    }
    const step = this.getActiveStep();
    if (!step) {
        return Result.fail(new WorkflowStateNotAuthorizedError(
            `Cannot approve a workflow state that is not in review.`
        ));
    }
    if (!canReview(step)) {
        return Result.fail(new WorkflowStateStepCannotReviewError(step));
    }
    if (!isStepOwner(step)) {
        return Result.fail(new WorkflowStateStepNotStepOwnerError(step));
    }
    this.approveStep(step.id, comment);
    const nextStep = this.getNextStep(step.id);
    this.updateRecord({
        state: nextStep ? WorkflowStateRecordState.pending : WorkflowStateRecordState.approved
    });
    return Result.ok();
}
```

`getActiveStep()` returns the `inReview` step, or `null` if any step is `rejected`.

**Consequence for the design:** an automated step cannot simply be "activated". `start()` requires
`canReview` (team overlap with the caller's teams) and `approve()` requires *both* `canReview` **and**
`isStepOwner` (i.e. the same identity that started it). A synthetic identity has no teams, so both
guards fail. A new domain method is required — see Risks.

## 2.4 How does the publish gate decide?

`packages/api-headless-cms-workflows/src/features/EntryWorkflows/handlers/ValidateWorkflowStateOnEntryBeforePublish.ts`:

```ts
async handle(event: EntryBeforePublishEventHandler.Event): Promise<void> {
    const { model, entry } = event.payload;

    if (!isModelAllowed(model)) {
        return;
    }

    const app = createWorkflowAppName({ model });

    const stateResult = await this.getTargetState.execute({ app, targetRevisionId: entry.id });

    if (stateResult.isFail()) {
        // If there's no state to deal with, exit early.
        return;
    }

    const state = stateResult.value;

    if (state?.done) {
        entry.system = { ...entry.system, workflow: null };
        return;
    }

    throw new WebinyError(
        "Cannot publish entry because its workflow state is not completed.",
        "WORKFLOW_STATE_NOT_COMPLETED",
        { app, entryId: entry.id, state: { ...state } }
    );
}
```

The gate reads **only** `state.done`, i.e. "every step's `state === approved`". It has no notion of
*who* or *what* approved a step. `isModelAllowed` excludes private and singleton models
(`packages/api-headless-cms-workflows/src/utils/modelAllowed.ts`).

Admin mirror (`app-headless-cms-workflows/src/presentation/ContentEntryFormPresenterWorkflowDecorator.ts`):

```ts
get vm(): IContentEntryFormViewModel {
    const base = this.original.vm;
    const wfVm = this.workflowPresenter.vm;

    return {
        ...base,
        canSave: base.canSave && !wfVm.hasState,
        canPublish: base.canPublish && (!wfVm.hasWorkflow || wfVm.isApproved)
    };
}
```

## 2.5 Exact sequence when a user requests a review

Mutation: `mutation { workflows { createWorkflowState(app: String!, targetRevisionId: ID!, title: String!) } }`
(`api-workflows/src/graphql/workflowState.ts`). Validation:

```ts
export const createWorkflowStateValidation = zod.object({
    app: zod.string().min(1, "App is required."),
    targetRevisionId: zod.string().min(1, "Target revision ID is required."),
    title: zod.string().min(5, "Title is required.")
});
```

`CreateWorkflowStateUseCase.execute`, in order:

1. `parseIdentifier(input.targetRevisionId)` — fail (`WorkflowStateValidationError`) if no version.
2. `listWorkflows({ where: { app }, limit: 1 })` — fail `WorkflowNotFoundError` if none;
   `MultipleWorkflowsFoundError` if `totalCount > 1`.
3. `getTargetState({ app, targetRevisionId })` — if one already exists, fail `ActiveStateExistsError`.
4. Fail `WorkflowStateValidationError` if `workflow.steps.length === 0`.
5. `identityContext.getIdentity()`.
6. `targetContextProvider.provide(...)` — for CMS this is the decorator that returns
   `{ folderId, modelId }`.
7. Build the record and persist it:

   ```ts
   const record: CreateWorkflowStateRepository.Input = {
       workflowId: workflow.id,
       comment: undefined,
       state: WorkflowStateRecordState.pending,
       app: input.app,
       title: input.title,
       targetId,
       isActive: true,
       targetRevisionId: input.targetRevisionId,
       targetContext,
       steps: workflow.steps.map(step => ({
           ...step,
           state: WorkflowStateRecordState.pending,
           savedBy: null,
           comment: null
       }))
   };

   const createResult = await this.repository.execute(record);
   ```

   (`CreateWorkflowStateRepository` → `CreateEntryUseCase` on the `wbyWorkflowState` model.)
8. `getUserTeams.execute(identity.id)`, construct `new WorkflowState(createdRecord, teams, identity)`.
9. Publish `WorkflowStateAfterCreateEvent({ state })`.
10. Return the `WorkflowState`.

The **only** consumer of step 9 today writes the summary onto the entry
(`UpdateEntryOnWorkflowStateAfterCreate`):

```ts
await this.updateEntry.execute(
    model,
    state.targetRevisionId,
    { system: { workflow: values } },
    { skipValidation: true }
);
```

with `values` from `packages/api-headless-cms-workflows/src/utils/state.ts`:

```ts
export const getStateValues = (state: WorkflowState): ICmsEntryWorkflowState => {
    const activeStep = state.currentStep;
    return {
        workflowId: state.workflowId,
        stepId: activeStep.id,
        stepName: activeStep.title,
        state: activeStep.state
    };
};
```

Note the workflow feature itself writes to the entry revision under review. This matters for any
attempt to make the revision immutable (see Risks).

Admin path: `WorkflowStatePresenter.requestReview` → `RequestReviewUseCase` →
`RequestReviewGateway` (single `CreateWorkflowState` GraphQL mutation). No other writes.

## 2.6 Is review creation a single interception point?

**Yes — a clean one.** `CreateWorkflowStateUseCase` is the sole writer of a workflow state
(`CreateWorkflowStateRepository` has no other caller), it is registered transient in the DI
container, and the DI layer supports decoration (`container.registerDecorator`). Two hook options:

- **Decorate `CreateWorkflowStateUseCase`** — runs *before* the state row is written, so checks
  could seed step verdicts into the initial `steps` array.
- **Handle `WorkflowStateAfterCreateEvent`** — runs after the row exists; matches how
  `api-headless-cms-workflows` already integrates.

`api-headless-cms-workflows` already decorates one abstraction in this feature
(`WorkflowStateContextProvider`), so the pattern is established.

---

# Area 3: Locking and rejection

## 3.1 Where does a revision lock, and what enforces it?

**There is no revision lock.** This is the single biggest divergence from the brief's assumptions.

CMS `entry.locked` exists but is derived purely from publish status, not from workflows:

```ts
// api-headless-cms/src/features/contentEntry/entryDataFactories/CreateEntryDataFactory/CreateEntryDataFactory.ts:167
const locked = status !== STATUS_DRAFT;
```

```ts
// .../CreatePublishEntryDataFactory/CreatePublishEntryDataFactory.ts:39
locked: true,
```

`UpdateEntryUseCase` checks it:

```ts
const originalEntry = result.value;

if (originalEntry.locked) {
    return Result.fail(new EntryLockedError());
}
```

A draft under review is `STATUS_DRAFT`, therefore `locked === false`, therefore
`updateEntry` succeeds. A grep for `lock` across all four workflow packages finds only an
admin-copy string and an unrelated `locked={true}` UI prop.

The "lock" is **entirely admin-UI**, in `ContentEntryFormPresenterWorkflowDecorator`:

```ts
async saveRevision(options?: { skipValidation?: boolean }): Promise<boolean> {
    if (this.workflowPresenter.vm.hasState) {
        return false;
    }
    return this.original.saveRevision(options);
}
```

plus `canSave: base.canSave && !wfVm.hasState`, plus a warning banner
(`Components/ContentEntryForm/ContentEntryFormWorkflow.tsx`):

```tsx
{presenter.vm.hasState ? (
    <Alert type="danger" className={"mt-sm"}>
        Any changes you do on the entry will not be stored!
    </Alert>
) : null}
```

Note `hasState` — not `isInReview`. Any active workflow state (including a *rejected* one) blocks
saving in the UI.

## 3.2 What can and cannot be modified on a "locked" revision?

Enforced at the API for a revision with an active, not-`done` workflow state:

| Operation | Blocked? | Where |
|---|---|---|
| Publish | **Yes** | `ValidateWorkflowStateOnEntryBeforePublish` (throws `WORKFLOW_STATE_NOT_COMPLETED`) |
| Move (to another folder) | **Yes** | `BlockMoveOnActiveWorkflowState` → `EntryMoveBlockedByWorkflowStateError` |
| Update / save values | **No** | `UpdateEntryUseCase` has no workflow-aware guard; `EntryWorkflows` feature registers no before-update handler |
| Create a new revision | **No** | nothing intercepts it |
| Permanent delete | **No** — allowed, and it cascades: `DeleteWorkflowStateOnEntryAfterDelete` deletes the state |
| Unpublish | **No** | no handler |

The registered handler set (`packages/api-headless-cms-workflows/src/features/EntryWorkflows/feature.ts`):

```ts
container.register(DeleteWorkflowsOnModelAfterDelete);
container.register(DeleteWorkflowStateOnEntryAfterDelete);
container.register(ValidateWorkflowStateOnEntryBeforePublish);
container.register(UpdateEntryOnWorkflowStateAfterCreate);
container.register(UpdateEntryOnWorkflowStateAfterUpdate);
container.register(ClearEntryStateOnWorkflowStateAfterDelete);
container.register(ClearEntryStateOnWorkflowStateCancel);
container.register(BlockMoveOnActiveWorkflowState);
container.registerDecorator(CmsWorkflowStateContextProvider);
container.registerDecorator(CmsWorkflowStateFilter);
```

No `EntryBeforeUpdate` handler. Confirmed by reading `feature.ts` in full.

## 3.3 What does a rejection write?

`rejectWorkflowStateStep(id: ID!, comment: String!)` → `RejectWorkflowStateStepUseCase` →
`WorkflowState.reject(comment)`:

```ts
reject(comment: string): Result<void, WorkflowState.Error> {
    if (isRejected(this.record)) {
        return Result.fail(new WorkflowStateRejectedError(this.record));
    }
    const step = this.getActiveStep();
    if (!step) {
        return Result.fail(new WorkflowStateNotInReview(
            `Cannot reject a workflow state that is not in review.`, this
        ));
    }
    if (!canReview(step)) {
        return Result.fail(new WorkflowStateStepCannotReviewError(step));
    }
    if (!isStepOwner(step)) {
        return Result.fail(new WorkflowStateStepNotStepOwnerError(step));
    }
    this.rejectStep(step.id, comment);
    this.updateRecord({ state: WorkflowStateRecordState.rejected });
    return Result.ok();
}
```

`rejectStep` → `updateStep(id, { state: rejected, comment })`, and `updateStep` always stamps
`savedBy` with the current identity. So the writes are:

- `steps[i].state = "rejected"`, `steps[i].comment = <comment>`, `steps[i].savedBy = <reviewer>`
- record `state = "rejected"` (`isActive` untouched — stays `true`)
- persisted via `UpdateWorkflowStateRepository`
- `WorkflowStateRejectEvent({ state })` published

The rejection comment is stored **on the step**, not as a collaboration thread. The
`api-notifications-integrations/src/workflows/WorkflowRejectedNotificationHandler.ts` turns it into
an in-app notification for `state.createdBy`.

## 3.4 What happens to the content review record after rejection?

It **stays** — `isActive: true`, `state: "rejected"`. Nothing deletes or deactivates it.

Because `GetTargetWorkflowStateRepository` filters on `isActive: true` only:

```ts
where: {
    values: {
        app: input.app,
        targetRevisionId: input.targetRevisionId,
        isActive: true
    }
},
limit: 1
```

the rejected state keeps being returned for that revision, so `hasState` stays true and the admin UI
keeps the revision unsavable and unpublishable indefinitely.

`WorkflowStateAfterUpdateEvent` → `UpdateEntryOnWorkflowStateAfterUpdate` refreshes
`entry.system.workflow` to the rejected step summary (`state.isActive` is still true, so it is not
nulled).

The author cannot cancel out of it either
(`app-workflows/src/presentation/workflowState/WorkflowStatePresenter.ts`):

```ts
private get canCancel(): boolean {
    if (!this.isOwner) {
        return false;
    } else if (this._state?.previousStep) {
        return false;
    } else if (
        this._state?.state === WorkflowStateValue.approved ||
        this._state?.state === WorkflowStateValue.rejected
    ) {
        return false;
    }
    return true;
}
```

## 3.5 New draft from a rejected revision → new review or reuse?

**A brand-new content review is created, and it starts from the first step.**

- The new revision has a new `targetRevisionId` (`<entryId>#0002`).
- `createWorkflowState`'s duplicate check is keyed on `targetRevisionId`, so it does not see the old
  state and does not fail.
- The new record's steps are built fresh: `steps: workflow.steps.map(step => ({ ...step, state: pending, savedBy: null, comment: null }))`.
- Sequencing then starts at the first `pending` step.

**Undocumented consequence:** the old rejected state on revision N is *not* deactivated. Nothing in
the codebase does that. After "reject → new revision → request review", the entry has **two**
`isActive: true` workflow states with the same `targetId` and different `targetRevisionId`. They are
distinguishable per-revision, but the Content Reviews list
(`listWorkflowStates`) has no de-duplication by `targetId`, so both appear. The list filter chain is
pass-through plus folder-level permissions only
(`DefaultWorkflowStateFilter`, `CmsWorkflowStateFilter`).

## 3.6 Any existing path that unlocks a revision without a rejection?

Yes, three:

1. **`cancelWorkflowState(id: ID!)`** — sets `isActive: false`, which clears `entry.system.workflow`
   via `ClearEntryStateOnWorkflowStateCancel`. The use case is:

   ```ts
   async execute(id: string): UseCase.Return {
       const result = await this.updateWorkflowState.execute(id, { isActive: false });
       if (result.isFail()) {
           return Result.fail(result.error);
       }
       await this.eventPublisher.publish(new WorkflowStateCancelEvent({ state: result.value }));
       return result;
   }
   ```

   **There is no permission check and no ownership check on the API side.** The `canCancel` /
   `isOwner` / not-rejected rules quoted in 3.4 exist only in the admin presenter. Any authenticated
   caller who can reach the GraphQL endpoint can cancel any workflow state by id, including a
   rejected one.
2. **`deleteWorkflow`** — and `DeleteWorkflowsOnModelAfterDelete` when a model is deleted.
3. **Permanent entry delete** — `DeleteWorkflowStateOnEntryAfterDelete` →
   `DeleteTargetWorkflowStateUseCase` → `WorkflowStateAfterDeleteEvent` →
   `ClearEntryStateOnWorkflowStateAfterDelete`.

---

# Area 4: Comments

## 4.1 Where is the comment entity defined on `feat/notifications`?

`packages/api-collaboration/src/domain/thread/abstractions.ts`. A "comment" in the brief's sense is a
**message inside a thread**:

```ts
export enum CollabThreadType {
    note = "note",
    task = "task"
}

/**
 * The canonical Webiny identity projection stored on records and messages.
 */
export interface ICollabIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface ICollabMessage {
    id: string;
    body: string;
    mentions: string[];
    createdBy: ICollabIdentity;
    createdOn: string;
    deleted?: boolean;
    deletedBy?: ICollabIdentity | null;
    deletedOn?: string | null;
}

/**
 * The values persisted on the `wbyCollabThread` CMS entry. `createdBy`/`createdOn` for the
 * thread itself are the CMS entry system fields and are NOT part of the stored values.
 */
export interface ICollabThreadValues {
    contentType: string;
    contentId: string;
    locator: string;
    type: CollabThreadType;
    resolved: boolean;
    resolvedBy?: ICollabIdentity | null;
    resolvedOn?: string | null;
    // task variant only
    assigneeId?: string | null;
    dueDate?: string | null;
    messages: ICollabMessage[];
    // soft-delete of the whole thread
    deleted?: boolean;
    deletedBy?: ICollabIdentity | null;
    deletedOn?: string | null;
}

export interface ICollabThread extends ICollabThreadValues {
    id: string;
    createdBy: ICollabIdentity;
    createdOn: string;
}
```

Storage: private CMS model `wbyCollabThread`
(`packages/api-collaboration/src/domain/thread/threadModel.ts`); `COLLAB_THREAD_MODEL_ID = "wbyCollabThread"`.

Registration is **currently ungated** (`packages/api-collaboration/src/index.ts`):

```ts
// TODO(before release): collaboration ships in the APW tier — re-gate on the
// appropriate WCP capability (e.g. wcpContext.canUseWorkflows()). Ungated for now so it
// works without a workflows license during development.
if (!tenantContext.getTenant()) {
    return;
}
```

## 4.2 What does `createdBy` require, and is it validated against real users?

`createdBy` is an `ICollabIdentity` — `{ id, displayName, type }`, all three `required()` in the CMS
model for message `createdBy`. It is **never client-supplied**; it is always projected from the
request identity (`packages/api-collaboration/src/utils/identity.ts`):

```ts
export const toCollabIdentity = (identity: WebinyIdentityLike): ICollabIdentity => {
    return {
        id: identity.id,
        displayName: identity.displayName,
        type: identity.type
    };
};
```

**No validation against a user store anywhere.** There is no lookup of `id` against
`api-security` users/teams at write or read time. `mentions` is likewise unvalidated —
`mentions: zod.array(zod.string()).optional()` in `graphql/validation.ts`, and the CMS model stores
it as `messageFields.text().label("Mentions").list()`.

The only identity gate is anonymity (`CreateThreadUseCase`):

```ts
const identity = this.identityContext.getIdentity();
if (identity.isAnonymous()) {
    return Result.fail(
        new CollabThreadNotAuthorizedError("You must be signed in to comment.")
    );
}
```

## 4.3 Can a comment be authored by a non-human or system identity today?

**Yes, with zero changes to `api-collaboration`.** The path is `IdentityContext.withIdentity`, which
is AsyncLocalStorage-scoped (`packages/api-core/src/features/security/IdentityContext/IdentityContext.ts`):

```ts
const identityStorage = new AsyncLocalStorage<Identity | undefined>();

getIdentity(): Identity {
    // Check for identity override first (from withIdentity())
    const override = identityStorage.getStore();
    if (override !== undefined) {
        return override;
    }
    return this.identity;
}

withIdentity<T>(identity: Identity | undefined, cb: () => Promise<T>): Promise<T> {
    return identityStorage.run(identity, cb);
}
```

`Identity.type` is a free-form string; `AuthenticatedIdentity` only overrides `isAnonymous()`:

```ts
export class AuthenticatedIdentity extends Identity {
    isAnonymous(): boolean {
        return false;
    }
}
```

The precedent already exists in the task runner
(`packages/background-tasks/src/api/runner/TaskControl.ts`), which synthesises an identity:

```ts
this.context.security.setIdentity(
    new AuthenticatedIdentity({
        id: task.createdBy.id,
        type: task.createdBy.type,
        displayName: task.createdBy.displayName ?? "",
        context: { canAccessTenant: true }
    })
);
```

**One caveat.** `CreateThreadUseCase` also calls `ResolveLocatorUseCase`, and the CMS resolver uses
entry read-access as the permission gate (`CmsLocatorResolver`):

```ts
// Loading the current revision is the read-access gate: it fails with
// "Cms/Entry/NotAuthorized" when the caller may not read the entry.
const entryResult = await this.getLatestRevision.execute(model, { id: entryId });
if (entryResult.isFail()) {
    if (entryResult.error.code === "Cms/Entry/NotAuthorized") {
        return { exists: false, authorized: false };
    }
    return { exists: false, authorized: true };
}
```

A synthetic identity has no roles/teams/permissions, so this returns `authorized: false` and the
thread creation fails. The smallest working combination is therefore
`withoutAuthorization(() => withIdentity(systemIdentity, () => createThread.execute(...)))` —
`getPermissions` short-circuits to `[{ name: "*" }]` when authorization is disabled. Both APIs
already exist; no change to `api-collaboration` is needed.

## 4.4 Can a comment anchor to a specific field?

**Yes.** `thread.locator` is an opaque string owned by the content-type resolver; empty string means
entry-level. For CMS it is a dotted `fieldId` path.

Server-side resolution (`packages/api-collaboration/src/features/cms/CmsLocatorResolver/modelLocator.ts`):

```ts
/**
 * Walks a `fieldId`-dotted locator (e.g. `author.address.2.street`) against a model definition.
 * Numeric segments are list indices and are skipped for structural matching. Returns whether the
 * field still exists in the model, its label, and the ancestor breadcrumb.
 */
export const walkModelLocator = (model: CmsModel, locator: string): ModelLocatorResult => {
```

Entry-level case (`CmsLocatorResolver`):

```ts
// Empty locator = an entry-level (unanchored) comment. The entry read above is the
// access gate; the anchor is the entry itself.
if (!params.locator || params.locator.trim().length === 0) {
    return { exists: true, authorized: true, label: "Entry", path: [], contentTitle };
}
```

On the admin side the locator comes from the form model's `qualifiedName`
(`packages/app-collaboration/src/cms/CommentFieldMarker.tsx`):

```tsx
const locator = field.qualifiedName;
const count = vm.threads.filter(thread => thread.locator === locator).length;
```

**Known limitation, documented in the code** (`packages/app-collaboration/src/cms/listFieldLocators.ts`):

```ts
/**
 * A field nested in a list field shares one qualifiedName across all array items (the form model
 * doesn't embed the item index), so it can't uniquely anchor a comment thread to a single element.
 * Comment markers are therefore hidden for these fields until per-element anchoring is supported
 * (tracked as a follow-up). Entry-level, top-level, and single (non-list) nested fields are
 * unaffected.
 */
```

So field-anchored findings inside repeatable fields are not addressable today.

## 4.5 How are comment notifications triggered? Would a system-authored comment fire them?

Via domain events (`packages/api-collaboration/src/domain/thread/events.ts`):
`CollabThreadCreatedEvent` and `CollabReplyAddedEvent`, handled in
`packages/api-notifications-integrations/src/collaboration/`.

`ThreadCreatedNotificationHandler`:

```ts
const actor = message.createdBy;
const title = anchor.contentTitle || anchor.label || "a comment";
const link = { app: APP_HEADLESS_CMS, contentType: thread.contentType, contentId: thread.contentId, locator: thread.locator, threadId: thread.id };

const recipients = new Set((message.mentions || []).filter(id => id && id !== actor.id));

for (const recipientId of recipients) {
    await this.createNotification.execute({
        recipientId, type: NotificationType.mention, actor, title, snippet: message.body, link
    });
}
```

`ReplyAddedNotificationHandler` additionally notifies prior-message authors as `NotificationType.reply`.

**A system-authored comment fires the event, but produces no notifications unless `mentions` is
populated.** New-thread notifications are mentions-only. To notify the author who requested the
review, either pass their identity id in `mentions`, or register an additional
`CollabThreadCreatedHandler`. The `actor` on the notification is `message.createdBy` verbatim, so a
system identity would show up as the actor with whatever `displayName`/`type` it carries — no
user-store lookup happens.

## 4.6 Are comments tied to a revision or to the entry?

**To the entry, across revisions.** `contentId` is revision-independent
(`packages/api-collaboration/src/utils/cmsContentId.ts`):

```ts
/**
 * For `cms.entry` content, the collaboration core's opaque `contentId` encodes both the model
 * and the (revision-independent) entry id as `"<modelId>:<entryId>"`.
 */
export const formatCmsContentId = (modelId: string, entryId: string): string => {
    return `${modelId}:${entryId}`;
};
```

and the resolver reads the *latest* revision (`GetLatestRevisionByEntryIdUseCase`). Listing filters on
`contentType` + `contentId` (+ optional `type` / `resolved`), never on revision.

**Consequence:** a check-step comment posted during review of `#0001` will still be visible on
`#0002`. Nothing carries or clears comments across revisions.

## 4.7 Is there an existing resolved / superseded concept?

**Resolved: yes.** Not superseded.

`ICollabThreadValues` carries `resolved`, `resolvedBy`, `resolvedOn`; the model has matching fields;
`ResolveThreadUseCase` / `ReopenThreadUseCase` flip it
(`packages/api-collaboration/src/features/thread/ThreadResolution/`):

```ts
thread.resolved = true;
thread.resolvedBy = toCollabIdentity(this.identityContext.getIdentity());
thread.resolvedOn = new Date().toISOString();
```

`listCollabThreads(where: { ..., resolved: Boolean })` can filter on it. Neither resolve nor reopen
performs any permission or ownership check.

Additionally, soft-delete exists at both thread and message level (`deleted`, `deletedBy`,
`deletedOn`), and `ListThreadsRepository` excludes soft-deleted threads at the query level.

Nothing auto-resolves a thread when a new revision is created or a review is re-run.

---

# Area 5: Asynchronous execution

## 5.1 What background-task infrastructure exists?

A first-class one. Abstractions live in `@webiny/api-core`; the engine lives in
`@webiny/background-tasks`.

`packages/api-core/src/features/task/TaskDefinition/abstractions.ts`:

```ts
export interface ITaskDefinition<
    I extends ITaskInput = ITaskInput,
    O extends ITaskOutput = ITaskOutput
> {
    id: string;
    title: string;
    description?: string;
    maxIterations?: number;
    databaseLogs?: boolean;
    isPrivate?: boolean;
    selfCleanup?: ISelfCleanup;

    run(params: ITaskRunParams<I, O>): Promise<ITaskResult<I, O>>;

    onBeforeTrigger?(params: ITaskBeforeTriggerParams<I>): Promise<void>;
    onDone?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    onError?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    onAbort?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    onMaxIterations?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    createInputValidation?(
        params: ITaskCreateInputValidationParams
    ): GenericRecord<keyof I, zod.Schema> | zod.Schema;
}

export enum TaskResultStatus {
    DONE = "done",
    CONTINUE = "continue",
    ERROR = "error",
    ABORTED = "aborted"
}
```

`packages/api-core/src/features/task/TaskService/abstractions.ts`:

```ts
export interface ITaskService {
    trigger: <...>(params: ITaskTriggerParams<T>) => Promise<Result<ITask<T, O>, BaseError>>;
    abort: <...>(params: ITaskAbortParams) => Promise<Result<ITask<T, O>, BaseError>>;
    fetchServiceInfo: (input: ITask<any, any> | string) => Promise<Result<IServiceInfo, BaseError>>;
}

export interface ITaskTriggerParams<I = TaskDefinition.TaskInput> {
    parent?: Pick<ITask, "id">;
    definition: string;
    name?: string;
    input?: I;
    delay?: number;
}

export enum TaskDataStatus {
    PENDING = "pending",
    RUNNING = "running",
    FAILED = "failed",
    SUCCESS = "success",
    ABORTED = "aborted"
}
```

**Directly relevant precedent:** `packages/ai-powerups/src/api/features/AiImageEnrichment/AiImageEnrichmentTask.ts`
is an AI call with a structured-output schema inside a background task. It is the closest existing
template for an AI step.

## 5.2 How is a task invoked, and how does the result reach the admin app?

**Invocation:** `TaskService.trigger({ definition, input })`, or the generic
`Mutation.backgroundTasks.triggerTask(definition: String!, input: JSON, name: String, delay: Number)`.

**Result delivery — websockets, not polling.** `packages/ai-powerups/src/api/features/CmsGenerateEntryContent/CmsGenerateEntryContentTask.ts`:

```ts
// Serialize at the transport edge: the use case returns structured values; the
// websocket stream carries a gzip+base64 JSON string that the Admin app decodes.
const compressed = await compressJson(result.value.values);
const payload = compressed.toString("base64");

await this.sendContentToUser(identity.id, payload, result.value.telemetry);

return controller.response.done("Entry content generated successfully.");
```

```ts
private async sendContentToUser(identityId: string, payload: string, telemetry: GenerateEntryContentTelemetry) {
    await this.sendToIdentity.execute(
        { id: identityId },
        { action: "aiPowerUps.generateEntryContent.content", data: { compression: "gzip", value: payload, telemetry } }
    );
}
```

Admin side (`packages/ai-powerups/src/admin/presentation/CmsContentGeneration/CmsGenerateContentDialog.tsx`):

```tsx
import { useWebsockets } from "@webiny/app-websockets";

const WS_ACTION_CONTENT = "aiPowerUps.generateEntryContent.content";
const WS_ACTION_ERROR = "aiPowerUps.generateEntryContent.error";
...
const websockets = useWebsockets();
const contentSubscription = websockets.onMessage<GenerateEntryContentMessage>(WS_ACTION_CONTENT, ...);
const errorSubscription = websockets.onMessage<GenerateEntryContentErrorMessage>(WS_ACTION_ERROR, ...);
```

Polling is also available if wanted: `Query.backgroundTasks.getTask(id: ID!)` and `listTasks(...)`.

Note `WebsocketsSendToIdentityUseCase` targets **one identity** — the task's creator. It is not a
broadcast, so a second reviewer watching the same review would not receive it.

## 5.3 Is the invocation mechanism abstracted, or AWS-coupled?

**Abstracted at the interface, AWS-coupled in the only shipped implementation.**

`ITaskService` is provider-neutral, with an explicit comment acknowledging it
(`TaskService/abstractions.ts`):

```ts
// The service info depends on the implementation.
// We cannot have a more precise type here, since implementation can be anything (AWS, Azure, etc.).
export type IServiceInfo = GenericRecord;
```

The default registration is Step Functions
(`packages/background-tasks/src/api/service/index.ts`):

```ts
new StepFunctionServicePlugin({ default: true }),
```

`StepFunctionServicePlugin.ts` imports `@webiny/aws-sdk/client-sfn` and uses
`manifest.api.bgTaskSfn` as the state-machine ARN; `EventBridgeEventTransportPlugin.ts` also exists.
`fetchServiceInfo` returns `DescribeExecutionCommandOutput` — an SFN type leaking through the
`IServiceInfo` alias. Tests substitute a mock
(`@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin` → `createMockTaskServicePlugin`).

## 5.4 Existing pattern for a mutation that queues and returns immediately?

**Yes, exactly this.** `packages/ai-powerups/src/api/graphql/BaseGraphQLSchema.ts`:

```ts
builder.addResolver<ICmsGenerateEntryContentTaskInput>({
    path: "AiPowerUpsMutation.generateEntryContent",
    dependencies: [TaskService],
    resolver: (taskService: TaskService.Interface) => {
        return async ({ args }) => {
            const result = await taskService.trigger<ICmsGenerateEntryContentTaskInput>({
                definition: CMS_GENERATE_ENTRY_CONTENT_TASK_ID,
                input: {
                    prompt: args.prompt,
                    modelId: args.modelId,
                    projectId: args.projectId ?? null,
                    excludedFileIds: args.excludedFileIds ?? null,
                    readerPersonaId: args.readerPersonaId ?? null,
                    writerPersonaId: args.writerPersonaId ?? null,
                    additionalFileIds: args.additionalFileIds ?? null
                }
            });

            if (result.isFail()) {
                throw result.error;
            }

            return { id: result.value.id };
        };
    }
});
```

Returns the task id immediately; the client then waits on websockets.

## 5.5 Retry and failure semantics

**There is no automatic retry.** `packages/background-tasks/src/api/runner/TaskManager.ts`:

```ts
try {
    const input = structuredClone(this.store.getInput());
    const controller = this.context.container.resolve(TaskController);
    /**
     * We always run the task without authorization because we are running a task without a user - nothing to authorize against.
     */
    result = await this.context.security.withoutAuthorization(async () => {
        return await definition.run({ input, controller });
    });
} catch (ex) {
    return this.response.error({ error: getErrorProperties(ex) });
}
```

- A thrown error → `response.error()` → task status `FAILED`. It is not re-run.
- `TaskResultStatus.CONTINUE` re-invokes `run` with new `input` and an optional `wait` (seconds).
  **This is the only retry mechanism, and the task must implement it itself.**
- Iteration ceiling: `DEFAULT_MAX_ITERATIONS = 50` (`api/decorators/RunnableTaskDecorator.ts`); on
  reaching it, `onMaxIterations` fires and the task errors with `"Task reached max iterations."`.
- Abort: `abortTask(id, message)`; the task must check `controller.runtime.isAborted()`.
- `selfCleanup: "always" | "never" | "onSuccess" | "onError" | "onAbort" | [...]`. Failed tasks
  normally persist and are visible in the Background Tasks screen; successful private tasks
  self-clean.
- **Identity inside a task is the triggering user, not a system identity** — see the `TaskControl`
  quote in 4.3. Combined with `withoutAuthorization` being applied by the runner, permissions are off
  but `getIdentity()` still returns the human who clicked.

---

# Area 6: AI provider configuration

## 6.1 How is the AI provider configured, and where do credentials live?

Two layers.

**Layer 1 — the provider-neutral abstraction**, `packages/api-core/src/features/ai/abstractions.ts`
(a thin wrapper over the Vercel AI SDK):

```ts
export interface IAiSdkFactory {
    readonly id: string; // machine id, e.g. "anthropic"
    readonly name: string; // human-friendly name, e.g. "Anthropic"
    readonly models: readonly IAiSdkModel[]; // static model list, no API call needed
    execute(apiKey?: string): Promise<IAiSdk>;
}

export interface IAiConnectionInline {
    readonly sdkName: string;
    readonly apiKey?: string;
}

export type AiGenerateTextParams = Omit<SDKGenerateTextParams, "model"> & {
    model: string;
    connection?: string | IAiConnectionInline;
};

export interface IAi {
    generateText(params: AiGenerateTextParams): ReturnType<typeof generateText>;
    streamText(params: AiStreamTextParams): Promise<ReturnType<typeof streamText>>;
    listModels(): Promise<AiModel[]>;
    listModelsByConnections(): Promise<AiModel[]>;
    listModelsByConnection(connection: string | IAiConnectionInline): Promise<AiModel[]>;
}
```

Shipped factories: `AnthropicSdkFactory.ts`, `OpenAiSdkFactory.ts`. Model ids are
`"<providerId>/<modelId>"`:

```ts
const slashIndex = modelId.indexOf("/");
if (slashIndex === -1) {
    throw new Error(
        `Invalid model ID "${modelId}". Expected format: "<providerId>/<modelId>" (e.g. "openai/gpt-4o").`
    );
}
```

**Important:** there are **zero `AiConnectionFactory` implementations** in the repo. Every caller
passes an inline `connection`. Calling `generateText({ model })` with no `connection` therefore
throws `No AI connection found for provider "..."`.

**Layer 2 — user-facing configuration**, `@webiny/ai-powerups`. Credentials are stored **encrypted**
in AI Power Ups settings (`packages/ai-powerups/src/api/features/Providers/types.ts`):

```ts
export interface ProviderPreset {
    id: string;
    name: string;
    description?: string;
    model: string;
    apiKey?: string;
    apiKeyMasked: string;
    apiKeyEncrypted: string;
}
```

`ProvidersHandler.ts` encrypts on write via `Encryption` from
`@webiny/api-core/features/encryption`:

```ts
// New plaintext key — encrypt and mask
apiKeyEncrypted = await this.encryption.encrypt(preset.apiKey);
apiKeyMasked = this.masker.mask(preset.apiKey, [8, 4]);
```

and `ProvidersGraphQLMapper.ts` only ever returns `apiKeyMasked` outward. Consumers decrypt at the
call site:

```ts
const apiKey = await this.encryption.decrypt(firstProvider.apiKeyEncrypted);
```

No `process.env` reads for AI credentials. Per the `webiny-api-architect` skill, runtime config flows
through `BuildParams`, not `process.env` — consistent with what the AI code does.

## 6.2 Can a model be selected per feature?

**The abstraction allows it; nothing does it.** Every existing consumer hardcodes
`presets[0]`:

```ts
// ai-powerups/src/api/features/CmsGenerateEntryContent/CmsGenerateEntryContentUseCase.ts
const settings = settingsResult.value;
const firstProvider = settings.providers.presets[0];

if (!firstProvider) {
    return Result.fail(
        new Error("No AI provider configured. Add a provider in AI Power Ups settings.")
    );
}
```

```ts
// ai-powerups/src/api/features/AiImageEnrichment/AiImageEnrichmentTask.ts
const firstProvider = aiSettings.providers.presets[0];
```

Each preset bundles one `model` string with one key. A new feature could select a preset by `id`
(`settings.providers.presets.find(...)`) and pass its `model`, but there is no existing per-feature
model setting, no admin UI for one, and no convention to copy.

## 6.3 Is there an existing abstraction over providers, and what does it expose?

Yes — `Ai` / `AiSdk` / `AiSdkFactory` / `AiConnectionFactory` / `AiSdkTool` / `AiSdkTools`, quoted in
6.1. `Ai` is registered with multi-injection
(`packages/api-core/src/features/ai/Ai.ts`):

```ts
dependencies: [
    [AiSdkFactory, { multiple: true }],
    [AiConnectionFactory, { multiple: true }],
    EventPublisher
]
```

It publishes four domain events (`packages/api-core/src/features/ai/events.ts`):
`AiBeforeGenerateTextEvent`, `AiAfterGenerateTextEvent` (carries `result` and `duration`),
`AiGenerateTextErrorEvent`, `AiBeforeStreamTextEvent`. Each has a corresponding handler abstraction,
so a new feature can observe every AI call without touching the caller.

SDK instances are cached per connection inside `AiImpl.getSdk`.

## 6.4 Existing pattern for requesting a structured response and validating it?

**Yes — two, and one of them is exactly what an AI verdict needs.**

**Preferred: `Output.object` with a zod schema** (`AiImageEnrichmentTask.ts`):

```ts
import { Output } from "ai";
import { z } from "zod";

const aiOutputSchema = Output.object({
    schema: z.object({
        tags: z.array(z.string()),
        description: z.string()
    })
});

...

const aiResult = await this.ai.generateText({
    model: firstProvider.model,
    output: aiOutputSchema,
    connection: {
        sdkName: firstProvider.model.split("/")[0],
        apiKey: await this.encryption.decrypt(firstProvider.apiKeyEncrypted)
    },
    messages: [ ... ]
});

tags = aiResult.output.tags;
description = aiResult.output.description;
```

This is the only use of `Output.object` in the repo; `generateObject` is not used anywhere.

**Fallback: lenient JSON scraping** (`packages/ai-powerups/src/api/features/WbGeneratePageContent/LlmJsonResponse.ts`),
used by both `WbGeneratePageContent` and `CmsGenerateEntryContent`:

```ts
static fromRawText(raw: string): LlmJsonResponse {
    let text = raw
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "")
        .trim();

    // Models that use tool calls sometimes emit a brief preamble before
    // the JSON ("Now I have the images, here's the page:") and/or trailing
    // prose after. Slice to the first `[`/`{` and the matching last
    // `]`/`}` so JSON.parse sees only the structured block.
    const startIdx = text.search(/[\[{]/);
    ...
}
```

There is also a full prompt-context builder (`AiPromptContextBuilder`, Projects / Writer Persona /
Reader Persona, project-file tools, Anthropic prompt caching via
`providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } }`) — reusable if the AI step
should honour the customer's configured AI setup.

## 6.5 Is token usage recorded anywhere?

**Yes, but only as an audit-log side effect.** `packages/api-audit-logs/src/subscriptions/ai/handlers/AuditLogAiAfterGenerateTextHandler.ts`:

```ts
const { requestId, result, duration } = event.payload;
const createAuditLog = getAuditConfig(AUDIT.AI.TEXT.GENERATE);

await createAuditLog(
    "AI Generate Text",
    {
        after: {
            status: "success",
            duration: Math.round(duration),
            text: result.text,
            usage: result.usage,
            finishReason: result.finishReason,
            steps: result.steps.length,
            toolCalls: result.steps.reduce((sum, step) => sum + step.toolCalls.length, 0)
        }
    },
    requestId,
    this.context
);
```

There is **no metering/quota store, no aggregation, and no per-tenant budget**. Audit logs also
expire (`expiresAt` from `deleteLogsAfterDays`) and are gated on the audit-logs feature being
installed and on the caller having an identity. The `telemetry` objects that
`CmsGenerateEntryContent` / `WbGeneratePageContent` return count tool calls and steps, not tokens.

---

# Area 7: Audit logs

## 7.1 Can the audit log record an actor that is not a real user?

**Yes.** The actor is projected from the current identity with no user-store lookup
(`packages/api-audit-logs/src/context/AuditLogsContextValue.ts`):

```ts
private getIdentity(): IAuditLogCreatedBy {
    const identity = this.getContext().security.getIdentity();
    return {
        id: identity.id,
        type: identity.type,
        displayName: identity.displayName || "unknown"
    };
}
```

```ts
export interface IAuditLogCreatedBy {
    id: string;
    type: string;
    displayName: string;
}
```

So `withIdentity(systemIdentity, ...)` produces a system-attributed audit entry. There is also an
override hook — `AuditLogBeforeCreateEvent` exposes `setAuditLog(input)`:

```ts
const beforeCreateEvent = new AuditLogBeforeCreateEvent({
    auditLog: auditLog,
    context,
    setAuditLog(input) {
        Object.assign(auditLog, input);
    }
});
await this.eventPublisher.publish(beforeCreateEvent);
```

**One gotcha:** creation is skipped when there is no identity id
(`packages/api-audit-logs/src/utils/getAuditConfig.ts`):

```ts
if (!context.security.getIdentity()?.id) {
    console.log("No identity - skipping audit log creation.");
    return null;
}
```

## 7.2 What is required to write a custom audit entry?

1. **Declare the app/entity/action** in `packages/common-audit-logs/src/apps.ts` (shared between API
   and admin). Shape (`packages/common-audit-logs/src/types.ts`):

   ```ts
   export interface Action { type: string; displayName: string; newEntryDelay?: number; }
   export interface Entity { type: string; displayName: string; linkToEntity?: (id: string) => string; actions: Action[]; }
   export interface App { app: string; displayName: string; entities: Entity[]; }
   ```

2. **Write the entry** through `getAuditConfig(AUDIT.<APP>.<ENTITY>.<ACTION>)`, which returns
   `(message, content, entityId, context) => Promise<IAuditLog | null>`:

   ```ts
   export const getAuditConfig = (audit: AuditAction) => {
       return async (
           message: string,
           content: GenericRecord,
           entityId: string,
           context: AuditLogsContext
       ): Promise<IAuditLog | null> => { ... };
   };
   ```

   It builds the payload (`app`, `entityId`, `entity`, `action`, `content`, `tags`), then writes
   inside `context.security.withoutAuthorization(...)`.

3. **Register a subscription hook** in `packages/api-audit-logs/src/subscriptions/<area>/` and add it
   to `subscriptions/index.ts`.

4. Beware the permission check on write (`checkPermissions`) — it requires an `al.*` or
   `al.<ACTION>` permission, which is why writes are wrapped in `withoutAuthorization`.

Note `content` is JSON-stringified into the record, and `newEntryDelay` makes repeat actions merge
into the previous entry rather than create a new one.

## 7.3 Are workflow configuration changes currently audited?

**No.** The configuration exists but nothing writes it.

`packages/common-audit-logs/src/apps.ts` declares an APW app (legacy v5 naming, with v5 route paths):

```ts
{
    app: "APW",
    displayName: "APW",
    entities: [
        { type: "CHANGE_REQUEST", displayName: "Change Request", actions: [ ... ] },
        { type: "COMMENT", displayName: "Comment", actions: [commonActions.CREATE] },
        {
            type: "CONTENT_REVIEW",
            displayName: "Content Review",
            linkToEntity(id) { return `/apw/content-reviews/${id}`; },
            actions: [commonActions.CREATE]
        },
        {
            type: "WORKFLOW",
            displayName: "Workflow",
            linkToEntity(id) { return `/apw/publishing-workflows?id=${id}`; },
            actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
        }
    ]
},
```

But `grep -rn 'AUDIT\.APW' packages/` returns **nothing**, and there is no `subscriptions/apw` or
`subscriptions/workflows` directory:

```ts
export const createSubscriptionHooks = (context: AuditLogsContext) => {
    createFileManagerHooks(context);
    createHeadlessCmsHooks(context);
    createSecurityHooks(context);
    createMailerHooks(context);
    createAcoHooks(context);
    createWebsiteBuilderHooks(context);
    createAiHooks(context);
};
```

`storeWorkflow` / `deleteWorkflow` / `createWorkflowState` / `approve` / `reject` all publish domain
events (`WorkflowAfterCreateEvent`, `WorkflowStateApproveStepEvent`, …), so wiring audit handlers is
straightforward — but it is net-new work, and the existing config's `linkToEntity` paths are wrong
for v6.

---

# Area 8: Permissions

## 8.1 What permission controls creating and editing workflows?

A single boolean, `workflows.editor`. Schema (`packages/app-workflows/src/domain/permissionsSchema.ts`):

```ts
export const WORKFLOWS_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "workflows",
    fullAccess: { editor: true }
});
```

No entities — it is binary full-access-with-one-flag. API type (`packages/api-workflows/src/types.ts`):

```ts
export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor: boolean;
}
```

Enforcement is hand-rolled per use case, not via a permissions abstraction
(`CreateWorkflowUseCase`, identical in `UpdateWorkflowUseCase` and `DeleteWorkflowUseCase`):

```ts
private async ensureManageAccess(): Promise<Result<void, WorkflowNotAuthorizedError>> {
    const permissions =
        await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(
            WORKFLOWS_PERMISSION
        );

    for (const permission of permissions) {
        if (permission.name === "*") {
            return Result.ok();
        } else if (permission.editor) {
            return Result.ok();
        }
    }

    return Result.fail(new WorkflowNotAuthorizedError("You cannot manage workflows."));
}
```

Reading is authenticated-only (`GetWorkflowUseCase`):

```ts
private async ensureHasAccess(): Promise<Result<void, WorkflowNotAuthorizedError>> {
    const identity = this.identityContext.getIdentity();
    if (!identity.isAnonymous()) {
        return Result.ok();
    }
    return Result.fail(new WorkflowNotAuthorizedError("You do not have access to workflows."));
}
```

There is also a licence gate: `wcpContext.canUseWorkflows()` in `api-workflows/src/index.ts` and
`useCanUseWorkflows()` in the admin.

## 8.2 What permission controls providing a sign-off on a step?

**None.** `grep -rln getPermissions packages/api-workflows/src/features/` returns only
`workflow/CreateWorkflow`, `workflow/UpdateWorkflow`, `workflow/DeleteWorkflow` and
`notifications/ListNotificationTypes`. Every `workflowState/*` use case —
`CreateWorkflowState`, `StartWorkflowStateStep`, `ApproveWorkflowStateStep`,
`RejectWorkflowStateStep`, `TakeOverWorkflowStateStep`, `CancelWorkflowState`,
`UpdateWorkflowState`, `DeleteWorkflowState`, `DeleteTargetWorkflowState` — performs **no permission
check at all**.

Authority to sign off comes only from **team membership**, evaluated inside the domain object:

```ts
const canReview = step.teams.some(team => {
    return this.teams.some(t => t.id === team.id);
});
```

where `this.teams` is `GetUserTeamsUseCase.execute(identity.id)`. Plus the review creator is excluded
from reviewing entirely (the `createdBy.id === identity.id` branch in `enrichStep`).

As noted in 3.6, `cancelWorkflowState` is a completely unguarded state mutation.

## 8.3 How would a new distinct permission be introduced?

Both sides use `createPermissionSchema`, but from different packages, and the schemas must agree on
prefix / entity ids / action names.

**Admin** (per the `webiny-admin-permissions` skill):

1. Extend `packages/app-workflows/src/domain/permissionsSchema.ts`. Because the current schema has no
   `entities`, adding a per-entity permission means restructuring it, e.g.:

   ```ts
   createPermissionSchema({
       prefix: "workflows",
       fullAccess: { editor: true },
       entities: [
           { id: "automatedStep", permission: "workflows.automatedStep", scopes: ["full"], actions: [{ name: "configure", label: "Configure automated steps" }] }
       ]
   })
   ```

2. `features/permissions/abstractions.ts` and `feature.ts` (`createPermissionsAbstraction` /
   `createPermissionsFeature`) pick up the schema automatically.
3. `presentation/permissions/SecurityPermissions.tsx` already passes the schema to
   `<Security.Permissions schema={...} />`, so the settings UI regenerates itself.
4. Gate UI with a `createHasPermission`-style component. Note `app-workflows` currently uses a
   **hand-written** `useWorkflowsPermission` / `HasWorkflowsEditorPermission` pair rather than
   `createUsePermissions` / `createHasPermission`, so a new permission would either extend the
   hand-written hook or introduce the generated ones alongside it.

**API:** `createPermissionSchema` also exists on the API side, exported from
`@webiny/api-core/exports/api/security.js` — e.g.
`packages/api-file-manager/src/domain/permissionsSchema.ts`:

```ts
export const FM_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "fm",
    fullAccess: true,
    entities: [
        { id: "file", permission: "fm.file", scopes: ["full", "own"], actions: [{ name: "rwd" }] },
        { id: "settings", permission: "fm.settings", scopes: ["full"] }
    ]
});
```

**`api-workflows` does not use it** — it does raw `getPermissions("workflows")` + `permission.editor`.
Introducing a distinct permission is therefore a good moment to migrate `api-workflows` onto the
schema-based pattern, but that is a refactor of the three existing checks, not an additive change.

Also worth noting: the schema-generated permission UI is one of the two "render a form from a schema"
mechanisms in the codebase (see Area 9.2).

---

# Area 9: Admin UI

## 9.1 Where is the workflow editor, and how are steps configured?

`packages/app-workflows/src/presentation/workflowsEditor/`:

- `WorkflowsEditorPresenter.ts` + `useWorkflowsEditorPresenter.ts` — MobX presenter
  (`addStep`, `updateStep`, `removeStep`, `moveStepUp`, `moveStepDown`, `canMoveStepUp`,
  `canMoveStepDown`).
- `components/Editor/WorkflowEditor.tsx`, `WorkflowEditorView.tsx`, `WorkflowEditorSteps.tsx`.
- `components/Editor/Step/Step.tsx` (accordion + inline edit card), `NewStep.tsx`,
  `InactiveStep.tsx` (the fixed Draft/Published bookends), `Step/RemoveStep.tsx`.
- `components/Editor/Step/Form/StepFormTitle.tsx`, `StepFormColor.tsx`, `StepFormDescription.tsx`,
  `StepFormTeams.tsx`, `StepFormNotifications.tsx`.
- `components/DataList/WorkflowsDataList.tsx`.
- CMS-specific shell: `packages/app-headless-cms-workflows/src/presentation/CmsWorkflowsEditorView.tsx`,
  `Routes/CmsWorkflowsEditor.tsx`, `presentation/cmsWorkflowsEditor/CmsWorkflowsEditorPresenter.ts`.

Steps are configured with the **imperative `@webiny/form` API**, not the schema-driven form model
(`Step.tsx`):

```tsx
<Form<IWorkflowStep> data={step} onSubmit={onSubmit}>
    {({ submit: onFormSubmit }) => {
        ...
        <Grid gap={"comfortable"}>
            <Grid.Column span={10}><StepFormTitle /></Grid.Column>
            <Grid.Column span={2}><StepFormColor /></Grid.Column>
            <Grid.Column span={12}><StepFormDescription /></Grid.Column>
            <Grid.Column span={12}><StepFormTeams /></Grid.Column>
            {/*<Grid.Column span={12}>*/}
            {/*    <StepFormNotifications items={notifications} />*/}
            {/*</Grid.Column>*/}
        </Grid>
```

Two things to flag:

- **The notifications field is commented out** in the editor. Combined with the dead transport (see
  Risks), per-step notifications are non-functional today.
- Each field is a hand-written `Bind` component, e.g. `StepFormTeams.tsx`:

  ```tsx
  <Bind name={"teams"} validators={validation.create("required,minLength:1")}>
      {bind => <Autocomplete bind={bind} />}
  </Bind>
  ```

Adding a per-step "kind" selector and conditional fields means new `Bind`-based components plus a
`WorkflowStepModel.toJS()` change.

## 9.2 Is there an existing pattern for rendering a form from a schema?

**Yes — two, and the general one is well-developed.**

**1. The Form Model** (`@webiny/app-admin/features/formModel`, documented by the `webiny-form-model`
skill). A declarative fluent builder with 14 field types, ~28 renderers, layout with tabs/rows/
separators, zod and imperative validation, conditional visibility/disable rules (`.rules()`,
`.hiddenWhen`, `.disabledWhen`), computed fields, reactive `.context()`, and object/dynamic-zone
templates. Notably:

- `fields.object().template(...)` → `dynamicZone` renderer is a **discriminated-union form** — the
  natural fit for "one of N check types, each with its own config fields".
- `FormModelFactory` is how the CMS New Entry Wizard and Website Builder page settings build forms.
- `IFieldVM.qualifiedName` (the `feat/notifications` addition) gives every field a stable dotted path.

**2. `createPermissionSchema` → `<Security.Permissions schema={...} />`** — a narrower
schema-to-form generator used for the security settings screens.

The workflow editor currently uses **neither**. Moving step configuration onto the Form Model would
be a rewrite of `Step.tsx` and its five `StepForm*` components, but it is the only mechanism in the
codebase that gives per-check-type config forms without hand-writing each one.

## 9.3 Where is the content review view, and where would a per-step panel fit?

There is no single "content review detail" page. Review state surfaces in five places:

| Surface | Location |
|---|---|
| Content Reviews list screen | `app-workflows/src/presentation/ContentReviews.tsx` → `workflowStateList/components/List/WorkflowStateListView.tsx` (+ `WorkflowStateListFilters.tsx`, `WorkflowStateListOptions.tsx`) |
| **Bar above the entry form** | `workflowState/components/Bar/WorkflowStateBar.tsx` + nine state-specific decorators in `Bar/Bars/` (`WorkflowStateBarRequestReview`, `…StartReview`, `…Review`, `…Approved`, `…Rejected`, `…CancelReview`, `…Workflow`, `…Loading`, `…Error`) |
| Step-progress tooltip | `workflowState/components/Tooltip/WorkflowStateTooltipContent.tsx` |
| Dashboard widgets | `workflowStatesWidget/components/WorkflowStatesOwnWidget.tsx`, `WorkflowStatesRequestedWidget.tsx` |
| CMS entry-list column | `app-headless-cms-workflows/src/presentation/TableRowMapperWorkflowDecorator.ts` |

**Best fit for a per-step panel: the bar area.** It is already decorator-based
(`makeDecoratable("WorkflowStateBarComponent", ...)`), it is injected into the CMS entry form by
`ContentEntryFormWorkflow` (`ContentEntryFormContent.createDecorator`), and it has the presenter in
hand. The existing tooltip is the closest thing to a per-step display and shows the shape a panel
would take:

```tsx
{state.steps.map(step => {
    return (
        <Fragment key={`step-${step.id}`}>
            <Grid.Column span={4}>
                <Tag swatchColor={step.color} content={step.title} variant={"neutral-light"} />
            </Grid.Column>
            <Grid.Column span={4}>
                <TagState state={step.state} />
            </Grid.Column>
            <Grid.Column span={4}>
                <WorkflowStateTooltipContentComment showComment={createShowComment(step)} step={step} />
            </Grid.Column>
        </Fragment>
    );
})}
```

A tooltip is the wrong container for check output (rationale text, findings list, re-run button), so
a panel would most likely be a new component rendered beside `<WorkflowStateBar />` inside
`ContentEntryFormWorkflow`, or a `Drawer`.

The comments panel that findings would land in is
`packages/app-collaboration/src/presentation/comments/components/CommentsPanel.tsx`, wired into the
CMS entry form via `CommentsSidePanelDecorator.tsx`, `CommentsHeaderButton.tsx`,
`FieldMarkerDecorator.tsx` and `CommentFieldMarker.tsx`.

## 9.4 Which `@webiny/admin-ui` primitives are available?

Everything needed, from `packages/admin-ui/src/index.ts`:

`Accordion`, `Alert`, `AutoComplete`, `Avatar`, `BetaBadge`, `Button`, `Calendar`, `Card`,
`Checkbox`, `CheckboxGroup`, `CodeEditor`, `ColorPicker`, `DataList`, `DataTable`, `DatePicker`,
`DelayedOnChange`, `Dialog`, `DragCursor`, `Drawer`, `DropdownMenu`, `DynamicFieldset`,
`EditableTitle`, `EmptyState`, `FilePicker`, `FillViewport`, `FormComponent`, `Grid`, `HeaderBar`,
`Heading`, `Icon`, `IconPicker`, `Image`, `ImageEditor`, `Input`, `Label`, `Link`, `List`, `Loader`,
`MultiAutoComplete`, `MultiFilePicker`, `MultiSelect`, `Popover`, `Portal`, `ProgressBar`,
`RadioGroup`, `RangeSlider`, `ScrollArea`, `Scrollbar`, `SegmentedControl`, `Select`, `Separator`,
`Sidebar`, `Skeleton`, `Slider`, `SteppedProgress`, `Switch`, `Table`, `Tabs`, `Tag`, `Tags`, `Text`,
`Textarea`, `TimeAgo`, `Toast`, `Toggle`, `ToggleGroup`, `Tooltip`, `Tree`, `Widget`, plus `hooks`
and `makeDecoratable`.

For this feature specifically: `SteppedProgress` / `Tag` / `TagState` for step state,
`Accordion` for a findings list, `Loader` / `ProgressBar` / `Skeleton` for the in-flight AI step,
`Alert` for a failed check, `CodeEditor` (`language`, `height` settings) for a rubric textarea if a
plain `Textarea` is not enough, `SegmentedControl` / `Select` for step kind, and `Drawer` for a
per-step panel.

---

# Assumptions: confirmed or falsified

### 1. New optional properties can be added to a step without breaking existing workflows or requiring a data migration
**Supported on data; contradicted on cost.** No data migration is needed — CMS value cleanup and
validation operate on top-level fields only, so existing `steps` rows simply lack the key and nothing
strips or rejects nested extras. But the value is silently dropped at **three whitelists** unless all
are updated: `stepValidation` (zod strips unknown keys), the GraphQL SDL types, and
`WorkflowStepModel.toJS()`. Budget ~11 files plus six test files. "No migration" is true; "cheap" is
not.

### 2. Content is genuinely immutable for the duration of a review, so a content-only check produces the same verdict at any point in the sequence
**Contradicted.** A draft revision under review is not locked at the API level: `entry.locked`
derives solely from publish status (`const locked = status !== STATUS_DRAFT`), and the `EntryWorkflows`
feature registers no before-update handler. Only *publish* and *move* are blocked. The immutability
that exists is one presenter method:

```ts
async saveRevision(options?: { skipValidation?: boolean }): Promise<boolean> {
    if (this.workflowPresenter.vm.hasState) {
        return false;
    }
    return this.original.saveRevision(options);
}
```

Anything that bypasses the admin form — the GraphQL API directly, the SDK, a bulk action, another
extension's event handler — can mutate the revision mid-review. **A verdict computed at step 1 is not
guaranteed to still hold at step 4.**

### 3. A rejection always requires the author to create a new revision, and a new review then starts from the first step
**Half supported.** The "new review starts from step 1" half is solid: a new revision gets a new
`targetRevisionId`, `createWorkflowState`'s duplicate check is keyed on `targetRevisionId` so it
succeeds, and steps are rebuilt all-`pending`.

The "always requires" half is UI-only. `canCancel` returns false once state is `rejected`, but
`cancelWorkflowState` on the API has **no permission and no ownership check** and no rejected-state
guard — it just sets `isActive: false`, which clears `entry.system.workflow` and re-enables saving.

Also undocumented: the rejected state on the old revision is never deactivated, so an entry ends up
with two `isActive: true` workflow states across revisions.

### 4. Review creation happens at a single interception point where checks could run before the revision locks
**Supported for the interception point; the second clause is moot.** `CreateWorkflowStateUseCase` is
the sole writer, is DI-registered and decoratable, and also emits `WorkflowStateAfterCreateEvent`.
There is no revision lock to run "before" (see #2), but there *is* a single well-defined place to run
checks and seed step verdicts before the state row is written.

### 5. Comments can be made to accept a system identity with a small, contained change
**Supported — smaller than assumed.** `createdBy` is projected from `identityContext.getIdentity()`,
`Identity.type` is a free string, and `IdentityContext.withIdentity` is AsyncLocalStorage-scoped and
already used this way by the task runner. **Zero changes to `api-collaboration` are required.** One
detail: because `CmsLocatorResolver` uses entry read-access as the permission gate, the call must be
wrapped in `withoutAuthorization` as well as `withIdentity`, or the synthetic identity fails the
authorization check.

### 6. Background task infrastructure exists that can run an operation taking tens of seconds and return a result to the admin app
**Supported, with an existing template.** `TaskDefinition` + `TaskService.trigger` + Step Functions;
`AiImageEnrichmentTask` already does exactly "AI call with a zod-validated structured response inside
a task, result pushed to the admin over websockets". `getTask` polling is available as an
alternative. Caveats: no automatic retry (Area 5.5), websocket delivery targets a single identity,
and the task's identity is the triggering human, not a system identity.

### 7. The publish gate reads step state in a way that would tolerate steps resolved by something other than a human sign-off
**Supported.** The gate reads only `state.done`, i.e. `steps.every(s => s.state === approved)`. It
never inspects `savedBy`, teams, or how a step reached `approved`. The admin mirror
(`canPublish: base.canPublish && (!wfVm.hasWorkflow || wfVm.isApproved)`) reads the record-level
`state` and is equally indifferent.

### 8. A per-step configuration payload can be stored without a schema redesign
**Supported, but net-new.** No per-step payload exists today. Adding `config: fields.json()` to the
step sub-schema in both `workflowModel.ts` and `stateModel.ts` is additive and matches an existing
pattern in the same model (`targetContext: fields.json()`). It still incurs the full boundary tax
from #1, and JSON fields are not usefully filterable through `CmsWhereMapper`.

---

# Risks and blockers

## Blockers — things that will not work as designed

### B1. `WorkflowState.approve()` cannot be called by a system identity
Approving requires *both* guards to pass:

```ts
if (!canReview(step)) { return Result.fail(new WorkflowStateStepCannotReviewError(step)); }
if (!isStepOwner(step)) { return Result.fail(new WorkflowStateStepNotStepOwnerError(step)); }
```

`canReview` is team overlap between the step's `teams` and `GetUserTeamsUseCase(identity.id)`;
`isStepOwner` is `step.savedBy?.id === identity.id`. A synthetic identity has no teams, so `canReview`
is false and `start()` fails too. And if you instead run the check as the *requesting user*, the
`createdBy.id === identity.id` branch in `enrichStep` forces `canReview: false` for them.

**There is no code path today by which a non-team, non-human actor can resolve a step.** A new domain
method on `WorkflowState` (e.g. `resolveAutomatically(stepId, verdict, comment)`) that bypasses the
team/owner guards is required. This is the largest single piece of new domain logic.

### B2. `teams` is structurally mandatory on a step
`teams: NonEmptyArray<IWorkflowStepTeam>` in TypeScript; `.min(1, "You must select at least one team.")`
in zod; `.required(...).listMinLength(1, ...)` in the **state** model:

```ts
teams: stepFields
    .object()
    .label("Teams")
    .list()
    .required("At least one team is required.")
    .listMinLength(1, "At least one team is required.")
```

An automated step has no reviewing team. Making `teams` conditional means relaxing the state model's
`required`/`listMinLength`, the zod validator, the `NonEmptyArray` types on both sides, and the admin
form's `required,minLength:1` validator — while keeping it mandatory for manual steps. That is
cross-cutting, and the state model change affects **all existing rows'** validation on next write.

### B3. Content mutability breaks verdict stability
See Assumption #2. Two ways out, both with costs:

- **Add an API-level guard.** An `EntryBeforeUpdateEventHandler` in `api-headless-cms-workflows`.
  **Trap:** the workflow feature itself writes to the revision under review —
  `UpdateEntryOnWorkflowStateAfterCreate` and `UpdateEntryOnWorkflowStateAfterUpdate` both call
  `updateEntry.execute(model, state.targetRevisionId, { system: { workflow: ... } }, { skipValidation: true })`.
  A naive block would deadlock the feature against itself. The guard has to distinguish
  system-metadata-only updates from value updates, and this handler sits on the hot path of **every**
  CMS entry update in the product.
- **Stamp the verdict with what it was computed against** (revision `savedOn`, or a content hash) and
  re-run when it changes. No CMS changes, contained to the new feature. Recommended.

## Risks — things that will make this harder than assumed

### R1. No `AiConnectionFactory` implementation exists
`Ai.generateText({ model })` without an explicit `connection` throws
`No AI connection found for provider "..."`. Every existing caller reads AI Power Ups settings,
decrypts `apiKeyEncrypted`, and passes an inline connection. So the AI step either
(a) takes a new dependency on `@webiny/ai-powerups` (`GetSettingsUseCase` + `Encryption`) — a new
cross-package dependency from the workflows packages into an add-on package, or
(b) registers the repo's **first** `AiConnectionFactory`, which is a change in `api-core`'s
neighbourhood and affects every AI consumer.

Also: every existing consumer hardcodes `providers.presets[0]`. If the workflow author is to choose a
model per AI step, that selection UI and plumbing is entirely new.

### R2. Sign-off is unauthorized today, so adding "who may configure automated steps" exposes the gap
No `workflowState/*` use case checks permissions; `cancelWorkflowState` is unguarded. If the new
feature introduces a distinct permission, reviewers will reasonably ask why the existing mutations
have none. Fixing that is a separate, wider change (nine use cases), and `api-workflows` does not use
`createPermissionSchema` at all, so it would also be a pattern migration.

### R3. Comments are per-entry, not per-review or per-revision
`contentId` is `<modelId>:<entryId>`. A check comment from the review of `#0001` will still be listed
on `#0002`, and re-running a check will accumulate threads. Nothing auto-resolves. Mitigation exists
(`resolved` + `ResolveThreadUseCase`, and `type: task`), but a policy has to be designed:
resolve-on-new-revision, resolve-on-re-run, or dedupe by locator + check id.

### R4. Field-anchored findings can't address list items
Documented in `packages/app-collaboration/src/cms/listFieldLocators.ts`: a field inside a list field
shares one `qualifiedName` across all items, so comment markers are hidden for those fields. An AI
step that says "item 3 of `sections` is off-brand" cannot anchor there today. `walkModelLocator`
already skips numeric segments server-side, so this is an admin-side gap too.

### R5. `qualifiedName` is `feat/notifications`-only
`IFieldVM.qualifiedName` in `@webiny/app-admin` does not exist on `next`. Any field-anchored design
is coupled to the notifications/collaboration branch landing.

### R6. Task failure semantics require own retry
No automatic retry. A transient provider error becomes a `FAILED` task and a step stuck in whatever
state it was in. Retry must be implemented as `TaskResultStatus.CONTINUE` with an attempt counter in
the task input, bounded by `maxIterations` (default 50). Also: a stuck `inReview` step is only
recoverable through `takeOverWorkflowStateStep`, which requires team overlap — unavailable to a
system-resolved step. A "re-run this check" affordance is not optional.

### R7. Step-level notifications are dead code — do not build on them
`NotificationTransport.send()` has **no caller** anywhere in the repo (the only references to
`NotificationTransport` outside its own directory are two registration lines in
`api-workflows/src/index.ts`), and `StepFormNotifications` is commented out of the editor. The
`notifications` field on a step is inert configuration. Notification delivery that does work goes
through `api-notifications` + `api-notifications-integrations`
(`WorkflowApprovedNotificationHandler`, `WorkflowRejectedNotificationHandler`,
`ThreadCreatedNotificationHandler`, `ReplyAddedNotificationHandler`).

### R8. Licence and tenancy gates
`api-workflows` bails out entirely unless `wcpContext.canUseWorkflows()`; `canReview` depends on teams,
which depend on `canUseTeams()` / `canUseAacl()` (see `applyAaclLogic` in `IdentityContext`).
`api-collaboration` is currently **ungated** with a `TODO(before release)` to put it behind the
workflows capability — the automated-steps feature will inherit whatever that becomes.

### R9. Small changes with wide blast radius
- `WorkflowState.enrichStep` / `approve` / `reject` / `start` — every reviewer interaction, all three
  app bindings (CMS, WB, list/widgets), and the `graphql/workflowState.ts` resolvers.
- `stateModel.ts` step sub-schema — validation for every existing workflow-state row.
- `IWorkflowStep` — shared by workflow *and* state (`IWorkflowStateRecordStep extends IWorkflowStep`),
  so one type change ripples into both models, both SDLs, both zod validators, and both admin models.
- Any `EntryBeforeUpdate` handler — the hot path of every CMS write in the product (see B3).
- `packages/api-workflows/src/domain/workflowState/WorkflowState.ts:142` throws
  `WorkflowStateNoCurrentStepError` from the `currentStep` **getter**, which GraphQL resolves eagerly.
  A step-state combination the getter doesn't anticipate (e.g. a new `skipped`/`failed` status) will
  throw during query resolution rather than returning a degraded result.
- The publish gate serialises the whole state into the error payload
  (`state: { ...state }`), so AI rationale text stored in `step.comment` would surface in a
  `WORKFLOW_STATE_NOT_COMPLETED` error to any caller. Keep verdict prose out of `comment` or accept
  the leak.

## Approaches that may be materially better than the one described

### A1. Give automated steps their own resolution path, not a fake sign-off
Rather than making a system identity satisfy `canReview` + `isStepOwner`, add a step `kind`
(`"manual" | "check" | "ai"`) and a dedicated domain method that transitions the step directly, with
its own guard ("this step is automated and not yet resolved"). This sidesteps B1 and B2 in one move:
automated steps need no `teams`, no `savedBy` identity semantics, and no synthetic identity for the
*workflow* mutation — only for the *comment*, where it is a two-line `withIdentity` wrapper. It also
keeps `enrichStep`'s human rules untouched, which is the riskiest function to change.

### A2. Run content-only checks at review creation, not as sequenced steps
`CreateWorkflowStateUseCase` is the one place where "the content is what it is" is unambiguously true,
and it is a single, decoratable interception point (Area 2.6). Running content-only checks there and
seeding the resulting step verdicts into the initial `steps` array:

- makes verdict stability real without touching CMS or fighting B3;
- needs no async coordination for fast checks;
- makes the step panel a pure display of a pre-computed result.

This conflicts with the brief's "step runs when it becomes active" model, and it doesn't suit an AI
step that takes tens of seconds (which would still block the mutation). A hybrid is plausible:
content-only *check* steps resolve at creation; *AI* steps queue a task at creation and resolve
asynchronously, so the review's step sequence is about **display order and gating**, not about when
work runs. Worth putting to the engineering team explicitly, because it changes the shape of the
design.

### A3. Model check findings as collaboration threads of `type: task`, and use `resolved`
`CollabThreadType.task` plus `resolved`/`resolvedBy`/`resolvedOn` and `assigneeId`/`dueDate` already
exist and are already surfaced in `CommentsPanel`. Findings-as-tasks gives the author a checklist and
gives the feature a natural "this finding is addressed" signal — without inventing a parallel findings
store. Combine with `locator` set from the CMS `fieldId` path so a finding points at the offending
field (subject to R4).

### A4. Copy `AiImageEnrichmentTask` rather than designing the AI plumbing
It is the only place in the repo that combines `TaskDefinition`, `Output.object({ schema: z.object(...) })`,
AI Power Ups credential decryption, and websocket result delivery — i.e. every mechanism an AI step
needs, in ~170 lines, with `maxIterations = 1`, `isPrivate = true`, `databaseLogs = false`,
`selfCleanup = ["onSuccess", "onAbort"]`. Using `Output.object` (rather than the
`LlmJsonResponse.fromRawText` string-scraping the CMS/WB generators use) gives schema-validated
verdicts with SDK-level retries on shape mismatch, which is what "returning a verdict in the same
shape" requires.

### A5. Wire audit-log handlers for workflow config while you are in there
`AUDIT.APW.WORKFLOW.{CREATE,UPDATE,DELETE}` and `AUDIT.APW.CONTENT_REVIEW.CREATE` already exist in
`common-audit-logs` but have no subscription hooks (Area 7.3). The domain events
(`WorkflowAfterCreateEvent`, `WorkflowAfterUpdateEvent`, `WorkflowAfterDeleteEvent`,
`WorkflowStateAfterCreateEvent`, `WorkflowStateApproveStepEvent`, `WorkflowStateRejectEvent`) are all
published already. Adding `subscriptions/workflows/` is small, closes a real gap, and gives the
automated-step verdicts somewhere durable to be recorded. The existing `linkToEntity` paths in
`apps.ts` are v5 routes and would need correcting.
