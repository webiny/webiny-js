# AI Workflow Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `packages/api-workflows` so workflow steps can be either human-reviewed or AI-evaluated, with AI steps auto-starting via background tasks.

**Architecture:** Add a `type: "human" | "ai"` discriminator to `IWorkflowStep`. AI steps carry an inline `prompt` and `model`. Event handlers on `WorkflowStateAfterCreateEvent` and `WorkflowStateApproveStepEvent` detect AI steps and trigger a background task. The task sets AI identity via `setIdentity()`, calls `StartWorkflowStateStep`, runs the prompt via `Ai.Interface`, and calls `ApproveWorkflowStateStep` or `RejectWorkflowStateStep` based on the structured verdict `{ status: "approved" | "rejected", comment?: string }`.

**Tech Stack:** TypeScript, Zod, Webiny DI (`createAbstraction`/`createImplementation`/`createFeature`), Webiny Background Tasks (`TaskDefinition`), Vercel AI SDK via `Ai.Interface`

---

## Review Resolutions

These issues were found during code review and resolved:

| # | Issue | Resolution |
|---|-------|-----------|
| 1 | `AI_IDENTITY` was a plain object but `setIdentity()` requires an `Identity` class | Create `AiIdentity` class extending `AuthenticatedIdentity` |
| 2 | Task ordering: `teams` becomes optional before null-guard is added | Merged domain types + AiIdentity + state machine into one task |
| 3 | `setIdentity()` mutates shared state — fragile? | Confirmed correct — bg tasks run as the triggering identity, `setIdentity()` is the standard pattern |
| 4 | `trigger()` return value ignored in event handlers | Added result check + error logging in both handlers |
| 5 | `TaskService`/`Ai` availability in bg task Lambda | Confirmed — same code as GraphQL Lambda, just different resource config |

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/domain/workflowState/AiIdentity.ts` | `AiIdentity` class extending `AuthenticatedIdentity`, used as `savedBy` for all AI step actions |
| `src/features/workflowState/AutoStartAiStep/abstractions.ts` | Task ID constant, task input interface |
| `src/features/workflowState/AutoStartAiStep/AutoStartAiStepOnCreateHandler.ts` | Event handler: check first step on workflow state create |
| `src/features/workflowState/AutoStartAiStep/AutoStartAiStepOnApproveHandler.ts` | Event handler: check next step after step approval |
| `src/features/workflowState/AutoStartAiStep/feature.ts` | DI registration for both handlers |
| `src/features/workflowState/AutoStartAiStep/index.ts` | Barrel export |
| `src/features/workflowState/AiWorkflowStepTask/abstractions.ts` | Task input/output types |
| `src/features/workflowState/AiWorkflowStepTask/AiWorkflowStepTaskDefinition.ts` | Background task: start step, run AI eval, approve/reject |
| `src/features/workflowState/AiWorkflowStepTask/feature.ts` | DI registration |
| `src/features/workflowState/AiWorkflowStepTask/index.ts` | Barrel export |

### Modified Files
| File | Change |
|------|--------|
| `src/domain/workflow/abstractions.ts` | Add `WorkflowStepType`, `type`, `prompt`, `model` to `IWorkflowStep`; make `teams` optional |
| `src/domain/workflow/workflowModel.ts` | Add `type`, `prompt`, `model` CMS fields to workflow step object |
| `src/domain/workflow/WorkflowMapper.ts` | Pass through new fields (verify only — steps are spread) |
| `src/domain/workflowState/stateModel.ts` | Add `type`, `prompt`, `model` CMS fields; make `teams` optional |
| `src/domain/workflowState/WorkflowState.ts` | Update `enrichStep` to handle AI steps; AI identity gets `canReview: true` on AI steps; null-guard `step.teams ?? []` |
| `src/features/shared/abstractions.ts` | Add `WorkflowStepType`, `type`, `prompt`, `model` to `IWorkflowStepInput`; make `teams` optional |
| `src/graphql/validation/step.ts` | Zod discriminated union: human steps require teams, AI steps require prompt + model |
| `src/graphql/workflows.ts` | Add `WorkflowStepType` enum, update `WorkflowStep`/`WorkflowStepInput` types |
| `src/graphql/workflowState.ts` | Add `type`, `prompt`, `model` to `WorkflowStateStep` type |
| `src/index.ts` | Register `AutoStartAiStepFeature` and `AiWorkflowStepTaskFeature` |

---

## Task 1: Update Domain Types, Create AI Identity, and Update State Machine

> Merged from original Tasks 1 + 6 to prevent a crash window where `teams` is optional at the type level but the null-guard in `enrichStep` hasn't been added yet.

**Files:**
- Modify: `src/domain/workflow/abstractions.ts`
- Modify: `src/features/shared/abstractions.ts`
- Create: `src/domain/workflowState/AiIdentity.ts`
- Modify: `src/domain/workflowState/WorkflowState.ts`

- [ ] **Step 1: Update `IWorkflowStep` in domain abstractions**

```typescript
/* File: src/domain/workflow/abstractions.ts */

/* Add after imports, before IWorkflowStepNotification: */
export type WorkflowStepType = "human" | "ai";

/* Replace existing IWorkflowStep with: */
export interface IWorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    type: WorkflowStepType;
    teams?: IWorkflowStepTeam[];
    notifications?: IWorkflowStepNotification[];
    prompt?: string;
    model?: string;
}
```

Remove the `NonEmptyArray` import if it was only used for `teams` in `IWorkflowStep`. Check `IWorkflowValues` — it uses `NonEmptyArray<IWorkflowStep>` for the `steps` array, which is fine (that's about the array itself, not teams).

- [ ] **Step 2: Update `IWorkflowStepInput` in shared abstractions**

```typescript
/* File: src/features/shared/abstractions.ts */

/* Add after existing imports: */
export type { WorkflowStepType } from "~/domain/workflow/abstractions.js";

/* Replace existing IWorkflowStepInput with: */
export interface IWorkflowStepInput {
    id: string;
    title: string;
    color: string;
    description?: string;
    type: WorkflowStepType;
    teams?: IWorkflowStepTeamInput[];
    notifications?: IWorkflowStepNotificationInput[];
    prompt?: string;
    model?: string;
}
```

Remove the `NonEmptyArray` import if it becomes unused.

- [ ] **Step 3: Create `AiIdentity` class**

Create `src/domain/workflowState/AiIdentity.ts`:

```typescript
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";

export class AiIdentity extends AuthenticatedIdentity {
    constructor() {
        super({
            id: "ai-reviewer",
            displayName: "AI Reviewer",
            type: "ai"
        });
    }
}

export const AI_IDENTITY = new AiIdentity();
```

- [ ] **Step 4: Update `enrichStep` in WorkflowState**

In `src/domain/workflowState/WorkflowState.ts`, import the AI identity:

```typescript
import { AI_IDENTITY } from "./AiIdentity.js";
```

Then replace the entire `enrichStep` method body:

```typescript
private enrichStep(params: IEnrichStepWithPermissionParams): IEnrichedWorkflowStateRecordStep {
    const { step, createdBy } = params;
    const identity = this.currentIdentity;

    const stepType = step.type ?? "human";
    const isAiStep = stepType === "ai";
    const isAiIdentity = identity.id === AI_IDENTITY.id;

    /* AI steps: only the AI identity can review; humans cannot. */
    if (isAiStep) {
        return {
            ...step,
            isOwner: step.savedBy?.id === identity.id,
            canTakeOver: false,
            canReview: isAiIdentity
        };
    }

    /* Human steps: existing logic unchanged. */
    if (createdBy.id === identity.id) {
        return {
            ...step,
            isOwner: false,
            canTakeOver: false,
            canReview: false
        };
    }

    const isOwner = step.savedBy?.id === identity.id;

    const canReview = (step.teams ?? []).some(team => {
        return this.teams.some(t => {
            return t.id === team.id;
        });
    });

    const canTakeOver =
        canReview && !!step.savedBy?.id && step.state === WorkflowStateRecordState.inReview;

    return {
        ...step,
        canTakeOver: !isOwner ? canTakeOver : false,
        isOwner,
        canReview
    };
}
```

Key changes:
- Reads `step.type`, defaults to `"human"` for backward compat with existing records.
- AI steps: `canReview = true` only for AI identity. `canTakeOver = false` always. `isOwner` based on `savedBy` match.
- Human steps: uses `step.teams ?? []` to handle optional teams safely — prevents null-deref.

- [ ] **Step 5: Verify types compile**

Run: `yarn check -p @webiny/api-workflows 2>&1 | tail -30`

- [ ] **Step 6: Commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "feat(api-workflows): add step type discriminator, AI identity, and state machine guards"
```

---

## Task 2: Update CMS Models

**Files:**
- Modify: `src/domain/workflow/workflowModel.ts`
- Modify: `src/domain/workflowState/stateModel.ts`

- [ ] **Step 1: Add AI fields to workflow model**

In `src/domain/workflow/workflowModel.ts`, inside the `steps` object's `.fields(fields => ({...}))` callback, add three new fields:

Add after `id`:
```typescript
type: fields
    .text()
    .label("Type")
    .required("Type is required.")
    .predefinedValues([
        { label: "Human", value: "human" },
        { label: "AI", value: "ai" }
    ]),
```

Add after the existing `notifications` field:
```typescript
prompt: fields.longText().label("Prompt"),
model: fields.text().label("Model"),
```

- [ ] **Step 2: Add AI fields to workflow state model**

In `src/domain/workflowState/stateModel.ts`, inside the `steps` object's `.fields(stepFields => ({...}))` callback:

Add after `id`:
```typescript
type: stepFields
    .text()
    .label("Type")
    .predefinedValues([
        { label: "Human", value: "human" },
        { label: "AI", value: "ai" }
    ]),
```

Add after `comment` (at the end of step fields):
```typescript
prompt: stepFields.longText().label("Prompt"),
model: stepFields.text().label("Model"),
```

Also remove `.required("At least one team is required.")` and `.listMinLength(1, "At least one team is required.")` from the `teams` field definition to make it optional for AI steps.

- [ ] **Step 3: Commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "feat(api-workflows): add type, prompt, model fields to CMS models"
```

---

## Task 3: Update Mappers

**Files:**
- Modify: `src/domain/workflow/WorkflowMapper.ts`
- Modify: `src/domain/workflowState/WorkflowStateMapper.ts`

- [ ] **Step 1: Verify WorkflowMapper**

In `src/domain/workflow/WorkflowMapper.ts`, the `fromCmsEntry` method does `steps: entry.values.steps` and `toCmsEntry` does `steps: workflow.steps`. Both spread the entire step object. New fields (`type`, `prompt`, `model`) flow through automatically.

No code changes needed — just verify.

- [ ] **Step 2: Verify WorkflowStateMapper**

In `src/domain/workflowState/WorkflowStateMapper.ts`, `fromCmsEntry` does `steps: input.values.steps` and `toCmsEntry` does `steps: input.steps`. Same pattern — new fields flow through.

No code changes needed — just verify.

- [ ] **Step 3: Verify types compile**

Run: `yarn check -p @webiny/api-workflows 2>&1 | tail -30`

- [ ] **Step 4: Commit (if any changes were needed)**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "feat(api-workflows): verify mappers pass through new step fields"
```

---

## Task 4: Update Zod Validation

**Files:**
- Modify: `src/graphql/validation/step.ts`

- [ ] **Step 1: Replace step validation with discriminated union**

Replace the entire content of `src/graphql/validation/step.ts`:

```typescript
import zod from "zod";

const notificationValidation = zod.object({
    id: zod.string().min(1, "Notification ID is required.")
});

const teamValidation = zod.object({
    id: zod.string().min(1, "Team ID is required.")
});

const descriptionField = zod
    .string()
    .nullish()
    .optional()
    .transform(value => {
        return value || undefined;
    });

const notificationsField = zod
    .array(notificationValidation)
    .nullish()
    .optional()
    .transform(value => {
        return value || undefined;
    });

const humanStepValidation = zod.object({
    id: zod.string().min(1, "ID is required."),
    title: zod.string().min(1, "Title is required."),
    color: zod.string().min(1, "Color is required."),
    type: zod.literal("human"),
    description: descriptionField,
    teams: zod
        .array(teamValidation)
        .min(1, "You must select at least one team."),
    notifications: notificationsField
});

const aiStepValidation = zod.object({
    id: zod.string().min(1, "ID is required."),
    title: zod.string().min(1, "Title is required."),
    color: zod.string().min(1, "Color is required."),
    type: zod.literal("ai"),
    description: descriptionField,
    teams: zod
        .array(teamValidation)
        .optional()
        .transform(value => {
            return value || [];
        }),
    notifications: notificationsField,
    prompt: zod.string().min(1, "Prompt is required for AI steps."),
    model: zod.string().min(1, "Model is required for AI steps.")
});

export const stepValidation = zod.discriminatedUnion("type", [
    humanStepValidation,
    aiStepValidation
]);
```

- [ ] **Step 2: Update workflow validation if needed**

Check `src/graphql/validation/workflow.ts` — it imports `stepValidation` and uses it in an array. The `.transform(value => value as NonEmptyArray<IWorkflowStep>)` may need updating since the discriminated union output type differs. Update the transform to match the new step types:

```typescript
/* In src/graphql/validation/workflow.ts, update the steps field: */
steps: zod
    .array(stepValidation)
    .min(1, "You must add at least one step.")
```

Remove the `.transform(value => value as NonEmptyArray<IWorkflowStep>)` if the Zod output type now satisfies `IWorkflowStep[]`. The `NonEmptyArray` constraint is enforced by `.min(1)`.

- [ ] **Step 3: Verify validation compiles**

Run: `yarn check -p @webiny/api-workflows 2>&1 | tail -30`

- [ ] **Step 4: Commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "feat(api-workflows): add Zod discriminated union for human/ai step validation"
```

---

## Task 5: Update GraphQL Schema

**Files:**
- Modify: `src/graphql/workflows.ts`
- Modify: `src/graphql/workflowState.ts`

- [ ] **Step 1: Update workflow GraphQL types**

In `src/graphql/workflows.ts`, update the `typeDefs` string:

Add the enum before `WorkflowStepInput`:
```graphql
enum WorkflowStepType {
    human
    ai
}
```

Update `WorkflowStepInput`:
```graphql
input WorkflowStepInput {
    id: String!
    title: String!
    color: String!
    description: String
    type: WorkflowStepType!
    teams: [WorkflowStepTeamInput!]
    notifications: [WorkflowStepNotificationInput!]
    prompt: String
    model: String
}
```

Note: `teams` changes from `[WorkflowStepTeamInput!]!` to `[WorkflowStepTeamInput!]` (no longer required at the GraphQL level — Zod handles conditional validation).

Update `WorkflowStep` output type:
```graphql
type WorkflowStep {
    id: String!
    title: String!
    color: String!
    description: String
    type: WorkflowStepType!
    teams: [WorkflowStepTeam!]
    notifications: [WorkflowStepNotification!]
    prompt: String
    model: String
}
```

- [ ] **Step 2: Update workflow state GraphQL types**

In `src/graphql/workflowState.ts`, update the `WorkflowStateStep` type — add `type`, `prompt`, `model` after the workflow-related fields, and make `teams` optional:

```graphql
type WorkflowStateStep {
    # workflow related
    id: String!
    title: String!
    color: String!
    description: String
    type: WorkflowStepType!
    teams: [WorkflowStateStepTeam!]
    notifications: [WorkflowStateStepNotification!]
    prompt: String
    model: String
    # state related
    state: CmsEntryStateValue!
    comment: String
    savedBy: WorkflowStateIdentity
    # current user can take action on this step?
    canReview: Boolean!
    # is current user an owner of the step?
    isOwner: Boolean!
    # can current user take over this step?
    canTakeOver: Boolean!
}
```

- [ ] **Step 3: Verify build**

Run: `yarn check -p @webiny/api-workflows 2>&1 | tail -30`

- [ ] **Step 4: Commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "feat(api-workflows): add AI step type to GraphQL schema"
```

---

## Task 6: Create Auto-Start Event Handlers

**Files:**
- Create: `src/features/workflowState/AutoStartAiStep/abstractions.ts`
- Create: `src/features/workflowState/AutoStartAiStep/AutoStartAiStepOnCreateHandler.ts`
- Create: `src/features/workflowState/AutoStartAiStep/AutoStartAiStepOnApproveHandler.ts`
- Create: `src/features/workflowState/AutoStartAiStep/feature.ts`
- Create: `src/features/workflowState/AutoStartAiStep/index.ts`

- [ ] **Step 1: Create abstractions**

Create `src/features/workflowState/AutoStartAiStep/abstractions.ts`:

```typescript
export const AI_WORKFLOW_STEP_TASK_ID = "aiWorkflowStep";

export interface IAiWorkflowStepTaskInput {
    workflowId: string;
    workflowStateId: string;
    stepId: string;
}
```

- [ ] **Step 2: Create the AfterCreate handler**

Create `src/features/workflowState/AutoStartAiStep/AutoStartAiStepOnCreateHandler.ts`:

```typescript
import { WorkflowStateAfterCreateHandler } from "~/features/workflowState/CreateWorkflowState/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { AI_WORKFLOW_STEP_TASK_ID } from "./abstractions.js";
import type { IAiWorkflowStepTaskInput } from "./abstractions.js";

class AutoStartAiStepOnCreateHandlerImpl implements WorkflowStateAfterCreateHandler.Interface {
    constructor(
        private readonly taskService: TaskService.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async handle(event: WorkflowStateAfterCreateHandler.Event): Promise<void> {
        const { state } = event.payload;
        const steps = state.steps;

        if (steps.length === 0) {
            return;
        }

        const firstStep = steps[0];

        if (!firstStep || (firstStep.type ?? "human") !== "ai") {
            return;
        }

        const result = await this.taskService.trigger<IAiWorkflowStepTaskInput>({
            definition: AI_WORKFLOW_STEP_TASK_ID,
            name: `AI Step: ${firstStep.title}`,
            input: {
                workflowId: state.workflowId,
                workflowStateId: state.id,
                stepId: firstStep.id
            }
        });

        if (result.isFail()) {
            this.logger.error({
                message: `Failed to trigger AI step task for workflow state "${state.id}", step "${firstStep.id}": ${result.error.message}`
            });
        }
    }
}

export const AutoStartAiStepOnCreateHandler = WorkflowStateAfterCreateHandler.createImplementation({
    implementation: AutoStartAiStepOnCreateHandlerImpl,
    dependencies: [TaskService, Logger]
});
```

Note: `Logger` import path may need verification. Search with:
```bash
grep -r "export.*const Logger " packages/api-core/src/ --include="*.ts" | grep -v dist | head -5
```

- [ ] **Step 3: Create the ApproveStep handler**

Create `src/features/workflowState/AutoStartAiStep/AutoStartAiStepOnApproveHandler.ts`:

```typescript
import { WorkflowStateApproveStepHandler } from "~/features/workflowState/ApproveWorkflowStateStep/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WorkflowStateRecordState } from "~/domain/workflowState/abstractions.js";
import { AI_WORKFLOW_STEP_TASK_ID } from "./abstractions.js";
import type { IAiWorkflowStepTaskInput } from "./abstractions.js";

class AutoStartAiStepOnApproveHandlerImpl implements WorkflowStateApproveStepHandler.Interface {
    constructor(
        private readonly taskService: TaskService.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async handle(event: WorkflowStateApproveStepHandler.Event): Promise<void> {
        const { state } = event.payload;

        /* If the workflow is fully approved, nothing to auto-start. */
        if (state.state === WorkflowStateRecordState.approved) {
            return;
        }

        /* Find the next pending step. */
        const nextPendingStep = state.steps.find(step => {
            return step.state === WorkflowStateRecordState.pending;
        });

        if (!nextPendingStep) {
            return;
        }

        if ((nextPendingStep.type ?? "human") !== "ai") {
            return;
        }

        const result = await this.taskService.trigger<IAiWorkflowStepTaskInput>({
            definition: AI_WORKFLOW_STEP_TASK_ID,
            name: `AI Step: ${nextPendingStep.title}`,
            input: {
                workflowId: state.workflowId,
                workflowStateId: state.id,
                stepId: nextPendingStep.id
            }
        });

        if (result.isFail()) {
            this.logger.error({
                message: `Failed to trigger AI step task for workflow state "${state.id}", step "${nextPendingStep.id}": ${result.error.message}`
            });
        }
    }
}

export const AutoStartAiStepOnApproveHandler =
    WorkflowStateApproveStepHandler.createImplementation({
        implementation: AutoStartAiStepOnApproveHandlerImpl,
        dependencies: [TaskService, Logger]
    });
```

- [ ] **Step 4: Create feature registration**

Create `src/features/workflowState/AutoStartAiStep/feature.ts`:

```typescript
import { createFeature } from "@webiny/feature/api";
import { AutoStartAiStepOnCreateHandler } from "./AutoStartAiStepOnCreateHandler.js";
import { AutoStartAiStepOnApproveHandler } from "./AutoStartAiStepOnApproveHandler.js";

export const AutoStartAiStepFeature = createFeature({
    name: "WorkflowState/AutoStartAiStep",
    register(container) {
        container.register(AutoStartAiStepOnCreateHandler);
        container.register(AutoStartAiStepOnApproveHandler);
    }
});
```

- [ ] **Step 5: Create barrel export**

Create `src/features/workflowState/AutoStartAiStep/index.ts`:

```typescript
export { AutoStartAiStepFeature } from "./feature.js";
export { AI_WORKFLOW_STEP_TASK_ID } from "./abstractions.js";
export type { IAiWorkflowStepTaskInput } from "./abstractions.js";
```

- [ ] **Step 6: Verify types compile**

Run: `yarn check -p @webiny/api-workflows 2>&1 | tail -30`

Verify `TaskService` and `Logger` import paths are correct. If not:
```bash
grep -r "export.*TaskService" packages/api-core/src/ --include="*.ts" | grep -v dist | head -10
grep -r "export.*const Logger" packages/api-core/src/ --include="*.ts" | grep -v dist | head -10
```

- [ ] **Step 7: Commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "feat(api-workflows): add auto-start event handlers for AI steps"
```

---

## Task 7: Create Background Task Definition

**Files:**
- Create: `src/features/workflowState/AiWorkflowStepTask/abstractions.ts`
- Create: `src/features/workflowState/AiWorkflowStepTask/AiWorkflowStepTaskDefinition.ts`
- Create: `src/features/workflowState/AiWorkflowStepTask/feature.ts`
- Create: `src/features/workflowState/AiWorkflowStepTask/index.ts`

- [ ] **Step 1: Create task abstractions**

Create `src/features/workflowState/AiWorkflowStepTask/abstractions.ts`:

```typescript
import type { IAiWorkflowStepTaskInput } from "~/features/workflowState/AutoStartAiStep/index.js";

export type { IAiWorkflowStepTaskInput };

export interface IAiWorkflowStepTaskOutput {
    status: "approved" | "rejected";
    comment?: string;
}

export interface IAiVerdict {
    status: "approved" | "rejected";
    comment?: string;
}
```

- [ ] **Step 2: Create the task definition**

Create `src/features/workflowState/AiWorkflowStepTask/AiWorkflowStepTaskDefinition.ts`:

```typescript
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { StartWorkflowStateStepUseCase } from "~/features/workflowState/StartWorkflowStateStep/index.js";
import { ApproveWorkflowStateStepUseCase } from "~/features/workflowState/ApproveWorkflowStateStep/index.js";
import { RejectWorkflowStateStepUseCase } from "~/features/workflowState/RejectWorkflowStateStep/index.js";
import { GetWorkflowStateUseCase } from "~/features/workflowState/GetWorkflowState/index.js";
import { AI_WORKFLOW_STEP_TASK_ID } from "~/features/workflowState/AutoStartAiStep/index.js";
import { AI_IDENTITY } from "~/domain/workflowState/AiIdentity.js";
import type { IAiWorkflowStepTaskInput } from "./abstractions.js";
import type { IAiWorkflowStepTaskOutput } from "./abstractions.js";
import type { IAiVerdict } from "./abstractions.js";

class AiWorkflowStepTaskDefinitionImpl
    implements TaskDefinition.Interface<IAiWorkflowStepTaskInput, IAiWorkflowStepTaskOutput>
{
    public readonly id = AI_WORKFLOW_STEP_TASK_ID;
    public readonly title = "AI Workflow Step Evaluation";
    public readonly maxIterations = 3;
    public readonly isPrivate = true;

    constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly ai: Ai.Interface,
        private readonly startStep: StartWorkflowStateStepUseCase.Interface,
        private readonly approveStep: ApproveWorkflowStateStepUseCase.Interface,
        private readonly rejectStep: RejectWorkflowStateStepUseCase.Interface,
        private readonly getWorkflowState: GetWorkflowStateUseCase.Interface
    ) {}

    public async run(
        params: TaskDefinition.RunParams<IAiWorkflowStepTaskInput, IAiWorkflowStepTaskOutput>
    ): Promise<TaskDefinition.Result<IAiWorkflowStepTaskInput, IAiWorkflowStepTaskOutput>> {
        const { input, controller } = params;

        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        /* Set AI identity — bg tasks run as the triggering identity via setIdentity. */
        this.identityContext.setIdentity(AI_IDENTITY);

        /* Start the AI step (transition pending → inReview). */
        const startResult = await this.identityContext.withoutAuthorization(async () => {
            return this.startStep.execute(input.workflowStateId);
        });

        if (startResult.isFail()) {
            return controller.response.error({
                message: `Failed to start AI step: ${startResult.error.message}`,
                code: "AI_STEP_START_FAILED"
            });
        }

        /* Resolve the step's prompt and model from the workflow state. */
        const stateResult = await this.identityContext.withoutAuthorization(async () => {
            return this.getWorkflowState.execute(input.workflowStateId);
        });

        if (stateResult.isFail()) {
            return controller.response.error({
                message: `Failed to get workflow state: ${stateResult.error.message}`,
                code: "AI_STEP_STATE_FETCH_FAILED"
            });
        }

        const state = stateResult.value;
        const step = state.steps.find(s => s.id === input.stepId);

        if (!step) {
            return controller.response.error({
                message: `Step "${input.stepId}" not found in workflow state.`,
                code: "AI_STEP_NOT_FOUND"
            });
        }

        if (!step.prompt) {
            return controller.response.error({
                message: `Step "${input.stepId}" has no prompt configured.`,
                code: "AI_STEP_NO_PROMPT"
            });
        }

        if (!step.model) {
            return controller.response.error({
                message: `Step "${input.stepId}" has no model configured.`,
                code: "AI_STEP_NO_MODEL"
            });
        }

        /* Run the AI evaluation. */
        /* The bg task resolves the data it needs to send — that is a separate concern. */
        /* For now, we send the prompt as-is with instructions to return a verdict. */
        const verdict = await this.evaluate(step.prompt, step.model, controller);

        if (!verdict) {
            return controller.response.error({
                message: "AI evaluation returned no verdict.",
                code: "AI_STEP_NO_VERDICT"
            });
        }

        /* Apply the verdict. */
        if (verdict.status === "approved") {
            const approveResult = await this.identityContext.withoutAuthorization(async () => {
                return this.approveStep.execute(input.workflowStateId, verdict.comment);
            });

            if (approveResult.isFail()) {
                return controller.response.error({
                    message: `Failed to approve step: ${approveResult.error.message}`,
                    code: "AI_STEP_APPROVE_FAILED"
                });
            }
        } else {
            const rejectResult = await this.identityContext.withoutAuthorization(async () => {
                return this.rejectStep.execute(
                    input.workflowStateId,
                    verdict.comment ?? "AI evaluation rejected this step."
                );
            });

            if (rejectResult.isFail()) {
                return controller.response.error({
                    message: `Failed to reject step: ${rejectResult.error.message}`,
                    code: "AI_STEP_REJECT_FAILED"
                });
            }
        }

        return controller.response.done("AI evaluation complete.", {
            status: verdict.status,
            comment: verdict.comment
        });
    }

    private async evaluate(
        prompt: string,
        model: string,
        controller: TaskDefinition.RunParams<IAiWorkflowStepTaskInput, IAiWorkflowStepTaskOutput>["controller"]
    ): Promise<IAiVerdict | null> {
        try {
            const result = await this.ai.generateText({
                model,
                messages: [
                    {
                        role: "system",
                        content: [
                            "You are a workflow step evaluator.",
                            "Evaluate the content based on the given prompt.",
                            "You MUST respond with valid JSON: { \"status\": \"approved\" | \"rejected\", \"comment\": \"<optional explanation>\" }",
                            "Nothing else. Just the JSON object."
                        ].join("\n")
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            const text = result.text.trim();
            const parsed = JSON.parse(text) as IAiVerdict;

            if (parsed.status !== "approved" && parsed.status !== "rejected") {
                await controller.logger.error({
                    message: `AI returned invalid status: ${parsed.status}`
                });
                return null;
            }

            return parsed;
        } catch (error) {
            await controller.logger.error({
                message: `AI evaluation failed: ${(error as Error).message}`
            });
            return null;
        }
    }
}

export const AiWorkflowStepTaskDefinition = TaskDefinition.createImplementation({
    implementation: AiWorkflowStepTaskDefinitionImpl,
    dependencies: [
        IdentityContext,
        Ai,
        StartWorkflowStateStepUseCase,
        ApproveWorkflowStateStepUseCase,
        RejectWorkflowStateStepUseCase,
        GetWorkflowStateUseCase
    ]
});
```

Note: The `evaluate` method is intentionally minimal. The prompt is passed as-is. When the prompt becomes a stringified object with tools/services config, this method will be updated to parse and use that config. That is a separate concern.

- [ ] **Step 3: Create feature registration**

Create `src/features/workflowState/AiWorkflowStepTask/feature.ts`:

```typescript
import { createFeature } from "@webiny/feature/api";
import { AiWorkflowStepTaskDefinition } from "./AiWorkflowStepTaskDefinition.js";

export const AiWorkflowStepTaskFeature = createFeature({
    name: "WorkflowState/AiWorkflowStepTask",
    register(container) {
        container.register(AiWorkflowStepTaskDefinition);
    }
});
```

- [ ] **Step 4: Create barrel export**

Create `src/features/workflowState/AiWorkflowStepTask/index.ts`:

```typescript
export { AiWorkflowStepTaskFeature } from "./feature.js";
```

- [ ] **Step 5: Verify types compile**

Run: `yarn check -p @webiny/api-workflows 2>&1 | tail -30`

If `Ai` or `TaskDefinition` imports fail, search for correct paths:
```bash
grep -r "export.*const Ai " packages/api-core/src/ --include="*.ts" | grep -v dist | head -5
```

- [ ] **Step 6: Commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "feat(api-workflows): add AI workflow step background task definition"
```

---

## Task 8: Wire Everything in index.ts

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Register new features**

In `src/index.ts`, add imports:

```typescript
import { AutoStartAiStepFeature } from "~/features/workflowState/AutoStartAiStep/feature.js";
import { AiWorkflowStepTaskFeature } from "~/features/workflowState/AiWorkflowStepTask/feature.js";
```

Then in the `workflowsContextPlugin` callback, after the existing feature registrations (after `TakeOverWorkflowStateStepFeature.register(context.container);`), add:

```typescript
/* AI step automation. */
AutoStartAiStepFeature.register(context.container);
AiWorkflowStepTaskFeature.register(context.container);
```

- [ ] **Step 2: Verify full build**

Run: `yarn build -p @webiny/api-workflows 2>&1 | tail -30`

If build fails, check for missing dependencies in `package.json`. The package may need explicit dependencies on:
- `@webiny/api-core` (likely already present)
- `ai` (for Vercel AI SDK types — likely already present via api-core)

If type errors appear, fix them and re-run.

- [ ] **Step 3: Commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "feat(api-workflows): register AI step features in workflow context"
```

---

## Task 9: Verify and Build

**Files:** None (verification only)

- [ ] **Step 1: Full type check**

Run: `yarn check -p @webiny/api-workflows 2>&1 | tail -50`

Fix any remaining type errors.

- [ ] **Step 2: Full package build**

Run: `yarn build -p @webiny/api-workflows 2>&1 | tail -30`

- [ ] **Step 3: Run existing tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`

Existing tests should still pass. If any fail due to the new required `type` field on steps, update test fixtures to include `type: "human"` on existing step definitions.

- [ ] **Step 4: Final commit (if any fixes were needed)**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "fix(api-workflows): fix test fixtures for AI step type field"
```
