# Migration Plan: api-workflows to Feature-Based Architecture

## Overview

This document outlines the complete refactoring plan for `packages/api-workflows` to migrate from context-based architecture to feature-based architecture with DI container orchestration.

**Reference Package:** `packages/api-aco`

---

## Current Architecture

- **Context-based**: `WorkflowsContext` and `WorkflowStateContext` classes attached to `context` object
- **Pub/sub events**: Using `createTopic` for lifecycle events
- **Mixed concerns**: Business logic, persistence, and authorization in context classes
- **Domain model**: `WorkflowState` class with state machine logic (needs DI fixes)

## Target Architecture

- **Feature-based structure**: Vertical slices by use case
- **DI Container orchestration**: All dependencies resolved via container
- **Domain events**: Replace pub/sub with `DomainEvent` abstractions
- **Clean separation**: Use cases ’ Repositories ’ CMS use cases directly
- **Pure domain models**: Zero framework dependencies
- **No context object**: Completely removed
- **No shared folders**: Each feature is fully self-contained

---

## Code Preservation Rules

**CRITICAL:** Preserve original implementation as much as possible!

1.  **Keep original logic** - Don't refactor unless necessary for DI changes
2.  **Keep original method signatures** - Including parameter structures
3.  **Keep original patterns** - Like helper function calls and data structures
4.  **Mark deviations** - Use `// NOTE:` comments for any changes

### Example of Preservation

```typescript
//  KEEP THIS - Original implementation
get steps() {
  return this.record.steps.map(step => {
    return this.enrichStep({
      createdBy: this.record.createdBy,
      step
    });
  });
}

// L DON'T CHANGE TO THIS
get steps() {
  return this.record.steps.map(step => this.enrichStep(step, this.record.createdBy));
}
```

---

## Phase 1: Domain Layer

### 1.1 Create `src/domain/workflow/`

**`abstractions.ts`** - All types and abstractions together
```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";

// Domain types (copied from context/abstractions/Workflow.ts)
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
  teams: IWorkflowStepTeam[];
  notifications?: IWorkflowStepNotification[];
}

export interface IWorkflow {
  id: string;
  app: string;
  name: string;
  steps: IWorkflowStep[];
}

// Abstractions
export const WorkflowModel = createAbstraction<CmsModel>("WorkflowModel");

export namespace WorkflowModel {
  export type Interface = CmsModel;
}

export interface IWorkflowMapper {
  fromCmsEntry(entry: any): IWorkflow;
  toCmsEntry(workflow: Omit<IWorkflow, 'id'>): Record<string, any>;
}

export const WorkflowMapper = createAbstraction<IWorkflowMapper>("WorkflowMapper");

export namespace WorkflowMapper {
  export type Interface = IWorkflowMapper;
}
```

**`errors.ts`** - Domain errors
```typescript
import { BaseError } from "@webiny/feature/api";

export class WorkflowNotFoundError extends BaseError {
  override readonly code = "Workflows/Workflow/NotFound" as const;

  constructor(id: string) {
    super({
      message: `Workflow "${id}" not found`,
      data: { id }
    });
  }
}

export class WorkflowNotAuthorizedError extends BaseError {
  override readonly code = "Workflows/Workflow/NotAuthorized" as const;

  constructor(message?: string) {
    super({
      message: message || "Not authorized to access workflow"
    });
  }
}

export class WorkflowPersistenceError extends BaseError {
  override readonly code = "Workflows/Workflow/Persistence" as const;

  constructor(error: Error) {
    super({
      message: error.message
    });
  }
}

export class WorkflowValidationError extends BaseError {
  override readonly code = "Workflows/Workflow/Validation" as const;

  constructor(message: string) {
    super({
      message
    });
  }
}
```

**`WorkflowMapper.ts`** - Mapper implementation
```typescript
import { createImplementation } from "@webiny/di";
import { WorkflowMapper as MapperAbstraction } from "./abstractions.js";
import type { IWorkflow } from "./abstractions.js";

class WorkflowMapperImpl implements MapperAbstraction.Interface {
  fromCmsEntry(entry: any): IWorkflow {
    // NOTE: Use original transformer logic from context/transformer/WorkflowsTransformer.ts
    return {
      id: entry.id,
      app: entry.values.app,
      name: entry.values.name,
      steps: entry.values.steps
    };
  }

  toCmsEntry(workflow: Omit<IWorkflow, 'id'>): Record<string, any> {
    // NOTE: Use original transformer logic from context/transformer/WorkflowsTransformer.ts
    return {
      app: workflow.app,
      name: workflow.name,
      steps: workflow.steps
    };
  }
}

export const WorkflowMapper = MapperAbstraction.createImplementation({
  implementation: WorkflowMapperImpl,
  dependencies: []
});
```

**`workflowModel.ts`** - CMS model definition (infrastructure concern)
```typescript
import { CmsModelPlugin } from "@webiny/api-headless-cms";

export const WORKFLOW_MODEL_ID = "workflowsWorkflow";

export const createWorkflowModel = () => {
  // NOTE: Copy exact implementation from context/models/workflowModel.ts
  return new CmsModelPlugin({
    // ... existing model definition
  });
};
```

---

### 1.2 Create `src/domain/workflowState/`

**`abstractions.ts`** - All types and abstractions
```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import type { IWorkflowStep } from "../workflow/abstractions.js";

// Enums
export enum WorkflowStateRecordState {
  pending = "pending",
  inReview = "inReview",
  approved = "approved",
  rejected = "rejected"
}

// Domain types (from context/abstractions/WorkflowState.ts)
export interface IWorkflowStateIdentity {
  id: string;
  displayName: string | null;
  type: string | null;
}

export interface IWorkflowStateRecordStep extends IWorkflowStep {
  state: WorkflowStateRecordState;
  comment: string | null;
  savedBy: IWorkflowStateIdentity | null;
}

export interface IWorkflowStateRecord {
  id: string;
  app: string;
  title: string;
  workflowId: string;
  targetId: string;
  targetRevisionId: string;
  isActive: boolean;
  comment: string | undefined;
  state: WorkflowStateRecordState;
  steps: IWorkflowStateRecordStep[];
  createdOn: Date;
  savedOn: Date;
  createdBy: IWorkflowStateIdentity;
  savedBy: IWorkflowStateIdentity;
}

export interface IEnrichedWorkflowStateRecordStep extends IWorkflowStateRecordStep {
  isOwner: boolean;
  canTakeOver: boolean;
  canReview: boolean;
}

export interface IWorkflowState {
  readonly id: string;
  readonly app: string;
  readonly title: string;
  readonly workflowId: string;
  readonly targetId: string;
  readonly targetRevisionId: string;
  readonly isActive: boolean;
  readonly comment: string | undefined;
  readonly state: WorkflowStateRecordState;
  readonly steps: IEnrichedWorkflowStateRecordStep[];
  readonly createdOn: Date;
  readonly savedOn: Date;
  readonly createdBy: IWorkflowStateIdentity;
  readonly savedBy: IWorkflowStateIdentity;
  readonly done: boolean;
  readonly currentStep: IEnrichedWorkflowStateRecordStep;
  readonly nextStep: IEnrichedWorkflowStateRecordStep | null;
  readonly previousStep: IEnrichedWorkflowStateRecordStep | null;
}

// Abstractions
export const WorkflowStateModel = createAbstraction<CmsModel>("WorkflowStateModel");

export namespace WorkflowStateModel {
  export type Interface = CmsModel;
}

export interface IWorkflowStateMapper {
  fromCmsEntry(entry: any): IWorkflowStateRecord;
  toCmsEntry(record: Omit<IWorkflowStateRecord, 'id'>): Record<string, any>;
}

export const WorkflowStateMapper = createAbstraction<IWorkflowStateMapper>("WorkflowStateMapper");

export namespace WorkflowStateMapper {
  export type Interface = IWorkflowStateMapper;
}
```

**`errors.ts`** - Domain errors
```typescript
import { BaseError } from "@webiny/feature/api";

export class WorkflowStateNotFoundError extends BaseError<{ id?: string; app?: string; targetRevisionId?: string }> {
  override readonly code = "Workflows/State/NotFound" as const;

  constructor(data: { id?: string; app?: string; targetRevisionId?: string }) {
    super({
      message: "Workflow state not found",
      data
    });
  }
}

export class WorkflowStateNotAuthorizedError extends BaseError {
  override readonly code = "Workflows/State/NotAuthorized" as const;

  constructor(message: string) {
    super({ message });
  }
}

export class WorkflowStatePersistenceError extends BaseError {
  override readonly code = "Workflows/State/Persistence" as const;

  constructor(error: Error) {
    super({ message: error.message });
  }
}

export class WorkflowStateValidationError extends BaseError {
  override readonly code = "Workflows/State/Validation" as const;

  constructor(message: string) {
    super({ message });
  }
}

export class ActiveStateExistsError extends BaseError {
  override readonly code = "Workflows/State/ActiveExists" as const;

  constructor(data: { app: string; targetRevisionId: string }) {
    super({
      message: "An active workflow state already exists for this target",
      data
    });
  }
}

export class MultipleWorkflowsFoundError extends BaseError {
  override readonly code = "Workflows/State/MultipleFound" as const;

  constructor(data: any) {
    super({
      message: "Multiple workflows found when only one was expected",
      data
    });
  }
}

export class WorkflowStateNoPendingStepError extends BaseError {
  override readonly code = "Workflows/State/NoPendingStep" as const;

  constructor() {
    super({
      message: "No pending step found in workflow state"
    });
  }
}
```

**`WorkflowState.ts`** - Rich domain model

See full implementation in plan - keep all original logic, only change:
- Constructor: Accept `currentIdentity: IWorkflowStateIdentity` instead of context
- Methods: Return `Result<void>` instead of `Promise<void>`, remove internal persistence
- Add `toRecord()` method to expose record for external persistence

**`guards/`** - Copy from `context/workflowState/guards/` preserving exact implementation

**`WorkflowStateMapper.ts`** - Mapper implementation using original transformer logic

**`stateModel.ts`** - Copy CMS model definition from `context/models/stateModel.ts`

---

## Phase 2: Workflow Features (`src/features/workflow/`)

### Error Handling Pattern

**CRITICAL:** No null returns! Use proper error types.

```typescript
//  CORRECT
Promise<Result<IWorkflow, RepositoryError>>

// L WRONG
Promise<Result<IWorkflow | null, RepositoryError>>
```

### Features to Implement

1. **GetWorkflow** - Get by app + id
2. **ListWorkflows** - List with filtering
3. **StoreWorkflow** - Upsert (create or update) with events
4. **DeleteWorkflow** - Delete with events

Each feature follows the standard structure:
- `abstractions.ts` - Use case + Repository abstractions
- `{Feature}Repository.ts` - Injects CMS use cases directly
- `{Feature}UseCase.ts` - Orchestrates repository calls
- `events.ts` - Domain events (if applicable)
- `feature.ts` - DI registration

---

## Phase 3: WorkflowState Features (`src/features/workflowState/`)

### Features to Implement (14 total)

1. **GetWorkflowState** - Returns `WorkflowState` instance
2. **GetTargetWorkflowState** - Query by app + targetRevisionId
3. **ListWorkflowStates** - List all with filtering
4. **ListOwnWorkflowStates** - Filter by current user
5. **ListRequestedWorkflowStates** - Filter by team membership
6. **CreateWorkflowState** - Initialize with workflow steps, with events
7. **UpdateWorkflowState** - Core update used by step operations, with events
8. **CancelWorkflowState** - Mark inactive
9. **DeleteWorkflowState** - Delete by id, with events
10. **DeleteTargetWorkflowState** - Delete by app + targetRevisionId
11. **StartWorkflowStateStep** - Calls `state.start()`, persists via Update
12. **ApproveWorkflowStateStep** - Calls `state.approve()`, persists via Update
13. **RejectWorkflowStateStep** - Calls `state.reject()`, persists via Update
14. **TakeOverWorkflowStateStep** - Calls `state.takeOver()`, persists via Update

### Key Pattern for Step Operations

```typescript
async execute(id: string, comment?: string): Promise<Result<WorkflowState, Error>> {
  // 1. Get state
  const getResult = await this.getStateRepository.execute(id);
  if (getResult.isFail()) return Result.fail(getResult.error);

  const state = getResult.value;

  // 2. Call domain logic (mutates internally)
  const actionResult = state.approve(comment); // or start(), reject(), takeOver()
  if (actionResult.isFail()) return Result.fail(actionResult.error);

  // 3. Persist via UpdateWorkflowState
  const updateResult = await this.updateStateRepository.execute(state);
  if (updateResult.isFail()) return Result.fail(updateResult.error);

  return Result.ok(updateResult.value);
}
```

---

## Phase 4: GraphQL Layer

Move validation from `~/validation/` to inline in GraphQL files.

**Pattern:**
```typescript
const getWorkflowValidation = z.object({
  app: z.string(),
  id: z.string()
});

// In resolver
const validated = await getWorkflowValidation.safeParseAsync(args);
if (!validated.success) {
  throw createZodError(validated.error);
}

const useCase = context.container.resolve(GetWorkflowUseCase);
const result = await useCase.execute(validated.data.app, validated.data.id);

if (result.isFail()) {
  throw result.error;
}

return result.value;
```

---

## Phase 5: Main Entry Point

```typescript
export const createWorkflows = () => {
  const plugin = new ContextPlugin<Context>(async context => {
    // 1. Register CMS models as plugins
    context.plugins.register(
      createModelPlugin(createWorkflowModel()),
      createModelPlugin(createWorkflowStateModel())
    );

    // 2. Resolve and register models in DI (following api-aco pattern)
    const getModel = container.resolve(GetModelUseCase);
    const identityContext = container.resolve(IdentityContext);

    await identityContext.withoutAuthorization(async () => {
      const workflowModel = await getModel.execute(WORKFLOW_MODEL_ID);
      const workflowStateModel = await getModel.execute(WORKFLOW_STATE_MODEL_ID);

      container.registerInstance(WorkflowModel, workflowModel.value);
      container.registerInstance(WorkflowStateModel, workflowStateModel.value);
    });

    // 3. Register mappers (singletons)
    container.register(WorkflowMapperImpl).inSingletonScope();
    container.register(WorkflowStateMapperImpl).inSingletonScope();

    // 4. Register features
    WorkflowFeature.register(container);
    WorkflowStateFeature.register(container);

    // 5. Register GraphQL
    context.plugins.register(createWorkflowsSchema(), createWorkflowStateSchema());
  });

  return plugin;
};
```

---

## Final File Structure

```
src/
   domain/
      workflow/
         abstractions.ts
         errors.ts
         WorkflowMapper.ts
         workflowModel.ts
      workflowState/
          abstractions.ts
          errors.ts
          WorkflowState.ts
          WorkflowStateMapper.ts
          stateModel.ts
          guards/ (5 files)
   features/
      workflow/
         GetWorkflow/ (4 files)
         ListWorkflows/ (4 files)
         StoreWorkflow/ (5 files with events)
         DeleteWorkflow/ (5 files with events)
         feature.ts
      workflowState/
          GetWorkflowState/ (4 files)
          GetTargetWorkflowState/ (4 files)
          ListWorkflowStates/ (4 files)
          ListOwnWorkflowStates/ (4 files)
          ListRequestedWorkflowStates/ (4 files)
          CreateWorkflowState/ (5 files with events)
          UpdateWorkflowState/ (5 files with events)
          CancelWorkflowState/ (3 files)
          DeleteWorkflowState/ (5 files with events)
          DeleteTargetWorkflowState/ (4 files)
          StartWorkflowStateStep/ (3 files)
          ApproveWorkflowStateStep/ (3 files)
          RejectWorkflowStateStep/ (3 files)
          TakeOverWorkflowStateStep/ (3 files)
          feature.ts
   graphql/
      workflows.ts (with inline validation)
      workflowState.ts (with inline validation)
   constants.ts
   types.ts
   index.ts
```

**Total: ~98 files**

---

## Migration Checklist

- [ ] Phase 1: Domain layer (workflow + workflowState)
- [ ] Phase 2: Workflow features (4 features)
- [ ] Phase 3: WorkflowState features (14 features)
- [ ] Phase 4: GraphQL resolvers
- [ ] Phase 5: Main index.ts
- [ ] Phase 6: Delete old `context/` and `validation/` folders
- [ ] Phase 7: Verify all operations work

---

## Key Principles

 **Preserve original logic** - Use `// NOTE:` for changes
 **No null returns** - Use proper error types
 **Pure domain models** - Identity as data
 **Full vertical slices** - No shared folders
 **Direct CMS injection** - No shared gateways
 **Domain events** - Replace pub/sub
 **Context elimination** - No context object
