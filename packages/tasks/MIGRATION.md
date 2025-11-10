Refactoring Plan for packages/tasks

Based on my analysis of the current packages/tasks implementation and comparison with the
packages/api-core architecture, here's the refactoring plan:

Current State Analysis

The packages/tasks package currently uses:
- Plugin-based task definitions via TaskDefinitionPlugin class
- Context-based CRUD operations injected via ContextPlugin
- Old plugin architecture to register task definitions and services
- Mixed concerns across multiple files without clear abstraction boundaries

Target Architecture (like api-core)

The refactored package should use:
- Abstractions defined using createAbstraction from @webiny/feature/api
- Feature-based registration using createFeature from @webiny/feature/api
- DI container for dependency injection instead of plugins
- Clean separation of concerns with proper use cases, repositories, and gateways

  ---
Detailed Refactoring Plan

1. Create Abstractions for Task Definition Registry

Current: Task definitions are registered via TaskDefinitionPlugin plugins
Target: Create abstraction for task definition registry

packages/tasks/src/features/shared/abstractions.ts

Create abstractions for:
- TaskDefinitionRegistry - Interface to register and retrieve task definitions
- TaskDefinition<I, O> - Interface representing a task definition (not a plugin)
- TaskExecutor - Interface for executing tasks
- TaskRepository - Interface for CRUD operations on tasks
- TaskLogRepository - Interface for CRUD operations on task logs

2. Convert Task Definition from Plugin to Abstraction Implementation

Current: TaskDefinitionPlugin extends Plugin class
Target: Create abstraction and implementation pattern

Files to create:
packages/tasks/src/features/shared/abstractions/TaskDefinition.ts
packages/tasks/src/features/shared/TaskDefinitionRegistryImpl.ts

The task definition should become:
- An abstraction interface that defines the contract
- Implementations registered via createImplementation
- No longer a plugin class

3. Refactor CRUD Operations to Use Cases

Current: CRUD operations in crud/ directory mixed with context
Target: Separate use cases for each operation

Create features:
packages/tasks/src/features/CreateTask/
- abstractions.ts (CreateTask abstraction, errors, types)
- CreateTaskUseCase.ts (implementation)
- feature.ts (DI registration)
- events.ts (TaskBeforeCreateEvent, TaskAfterCreateEvent)

packages/tasks/src/features/GetTask/
- abstractions.ts
- GetTaskUseCase.ts
- feature.ts

packages/tasks/src/features/ListTasks/
- abstractions.ts
- ListTasksUseCase.ts
- feature.ts

packages/tasks/src/features/UpdateTask/
- abstractions.ts
- UpdateTaskUseCase.ts
- feature.ts

packages/tasks/src/features/DeleteTask/
- abstractions.ts
- DeleteTaskUseCase.ts
- feature.ts

packages/tasks/src/features/TriggerTask/
- abstractions.ts
- TriggerTaskUseCase.ts
- feature.ts

packages/tasks/src/features/AbortTask/
- abstractions.ts
- AbortTaskUseCase.ts
- feature.ts

4. Refactor Task Execution to Use Case Pattern

Current: TaskRunner and TaskManager classes handle execution
Target: Convert to use case with proper abstractions

packages/tasks/src/features/ExecuteTask/
- abstractions.ts (ExecuteTask abstraction)
- ExecuteTaskUseCase.ts
- feature.ts

5. Create Repository Implementations

Current: Direct database access via CMS models
Target: Repository pattern with gateway for database access

packages/tasks/src/features/shared/TaskRepository.ts
packages/tasks/src/features/shared/TaskRepositoryGateway.ts
packages/tasks/src/features/shared/TaskLogRepository.ts
packages/tasks/src/features/shared/TaskLogRepositoryGateway.ts

Register repositories in singleton scope:
container.register(TaskRepositoryImpl).inSingletonScope();
container.register(TaskLogRepositoryImpl).inSingletonScope();

6. Convert Task Service Plugins to Abstractions

Current: TaskServicePlugin abstract class with implementations
Target: Create abstraction for task service

packages/tasks/src/features/shared/abstractions/TaskService.ts

Create implementations:
packages/tasks/src/service/StepFunctionTaskService.ts (implementation)
packages/tasks/src/service/EventBridgeTaskService.ts (implementation)

Register via:
container.registerInstance(TaskService, new StepFunctionTaskService(...));

7. Create Main Tasks Feature

Create a top-level feature that composes all sub-features:

```ts
// packages/tasks/src/features/TasksFeature.ts

export const TasksFeature = createFeature({
    name: "Tasks",
    register(container) {
        // Register shared components
        container.register(TaskRepositoryImpl).inSingletonScope();
        container.register(TaskLogRepositoryImpl).inSingletonScope();
        container.register(TaskDefinitionRegistryImpl).inSingletonScope();

        // Register use case features
        CreateTaskFeature.register(container);
        GetTaskFeature.register(container);
        ListTasksFeature.register(container);
        UpdateTaskFeature.register(container);
        DeleteTaskFeature.register(container);
        TriggerTaskFeature.register(container);
        AbortTaskFeature.register(container);
        ExecuteTaskFeature.register(container);
    }
});
```

8. Replace Context Plugin with DI Container Resolution

Current: Context injected via ContextPlugin
Target: Resolve from DI container when needed

Instead of context.tasks.*, consumers will:
```ts
const createTask = container.resolve(CreateTask);
await createTask.execute(input);
```

9. Update Public API (index.ts)
```ts
// Export main feature
export { TasksFeature } from "./features/TasksFeature.js";

// Export abstractions
export { CreateTask } from "./features/CreateTask/abstractions.js";
export { GetTask } from "./features/GetTask/abstractions.js";
export { TriggerTask } from "./features/TriggerTask/abstractions.js";
export { TaskDefinition } from "./features/shared/abstractions.js";

// Export types
export type { Task, TaskInput, TaskLog } from "./features/shared/types.js";

// Export domain events
export { TaskBeforeCreateEvent, TaskAfterCreateEvent } from "./features/CreateTask/events.js";

// DO NOT export implementations
```

10. Migration Path

To maintain backward compatibility during migration:

1. Phase 1: Create new abstractions and implementations alongside existing plugin system
2. Phase 2: Add adapter layer that wraps old plugins as new abstractions
3. Phase 3: Migrate consumers to use new abstractions
4. Phase 4: Remove old plugin-based code

11. Error Handling

Create domain-specific errors:

packages/tasks/src/features/shared/errors.ts

export class TaskNotFoundError extends BaseError { ... }
export class TaskValidationError extends BaseError { ... }
export class TaskExecutionError extends BaseError { ... }
export class TaskDefinitionNotFoundError extends BaseError { ... }

  ---
Key Benefits

1. Clear separation of concerns - Each use case is independent
2. Type-safe dependency injection - No more context pollution
3. Testability - Easy to mock dependencies
4. Composability - Features can be composed and reused
5. No plugin system overhead - Direct DI container usage
6. Event-driven architecture - Domain events for cross-cutting concerns
7. Consistent with api-core - Same patterns across codebase

  ---
Summary

This refactoring converts the tasks package from a plugin-based architecture to a feature-based
architecture using:
- Abstractions instead of plugin classes
- Use cases for business logic
- Repositories for data access
- Features for DI registration
- Domain events for lifecycle hooks
- Result types for error handling

The new architecture aligns with packages/api-core and follows clean architecture principles.
