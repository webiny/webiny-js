# Background Tasks Admin UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin UI for monitoring and managing background tasks — list view with search/filter/pagination and a drawer-based detail view with task info, JSON payloads, and execution logs.

**Architecture:** New `packages/background-tasks` package following the webhooks pattern. Admin-only for now (api is a placeholder). Uses the 4-layer feature pattern (gateway → repository → usecase → presenter) with MobX-based reactive state and `@webiny/admin-ui` components.

**Tech Stack:** React 18, MobX, `@webiny/admin-ui` (DataTable, Drawer, Tag, TimeAgo, CodeEditor), `@webiny/feature` (DI), `@webiny/app-admin` (ListPresenter, security), GraphQL via `MainGraphQLClient`.

---

## File Structure

```
packages/background-tasks/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── src/
    ├── index.ts                                          # Re-exports admin entry
    ├── admin/
    │   ├── index.ts                                      # Exports BackgroundTasks + Routes
    │   ├── routes.ts                                     # Route definitions
    │   ├── permissions.ts                                # Permission schema
    │   ├── BackgroundTasks.tsx                            # Main component (feature registration)
    │   ├── BackgroundTaskRoutes.tsx                       # Route + menu registration
    │   ├── shared/
    │   │   └── types.ts                                  # Re-exported SDK types
    │   ├── features/
    │   │   ├── listTasks/
    │   │   │   ├── abstractions.ts
    │   │   │   ├── ListTasksUseCase.ts
    │   │   │   ├── ListTasksGateway.ts
    │   │   │   ├── feature.ts
    │   │   │   └── index.ts
    │   │   ├── getTask/
    │   │   │   ├── abstractions.ts
    │   │   │   ├── GetTaskUseCase.ts
    │   │   │   ├── GetTaskGateway.ts
    │   │   │   ├── feature.ts
    │   │   │   └── index.ts
    │   │   ├── deleteTask/
    │   │   │   ├── abstractions.ts
    │   │   │   ├── DeleteTaskUseCase.ts
    │   │   │   ├── DeleteTaskGateway.ts
    │   │   │   ├── feature.ts
    │   │   │   └── index.ts
    │   │   ├── abortTask/
    │   │   │   ├── abstractions.ts
    │   │   │   ├── AbortTaskUseCase.ts
    │   │   │   ├── AbortTaskGateway.ts
    │   │   │   ├── feature.ts
    │   │   │   └── index.ts
    │   │   ├── listLogs/
    │   │   │   ├── abstractions.ts
    │   │   │   ├── ListLogsUseCase.ts
    │   │   │   ├── ListLogsGateway.ts
    │   │   │   ├── feature.ts
    │   │   │   └── index.ts
    │   │   ├── listDefinitions/
    │   │   │   ├── abstractions.ts
    │   │   │   ├── ListDefinitionsUseCase.ts
    │   │   │   ├── ListDefinitionsGateway.ts
    │   │   │   ├── feature.ts
    │   │   │   └── index.ts
    │   │   └── permissions/
    │   │       ├── abstractions.ts
    │   │       ├── feature.ts
    │   │       └── index.ts
    │   └── presentation/
    │       ├── security/
    │       │   ├── HasPermission.tsx
    │       │   └── usePermissions.ts
    │       ├── TaskList/
    │       │   ├── abstractions.ts
    │       │   ├── TaskListPresenter.ts
    │       │   ├── TaskListDataSource.ts
    │       │   ├── feature.ts
    │       │   ├── index.ts
    │       │   └── components/
    │       │       └── TaskListView.tsx
    │       └── TaskDetail/
    │           ├── abstractions.ts
    │           ├── TaskDetailPresenter.ts
    │           ├── TaskDetailDataSource.ts
    │           ├── feature.ts
    │           ├── index.ts
    │           └── components/
    │               └── TaskDetailDrawer.tsx
    └── api/
        └── index.ts                                      # Empty placeholder
```

---

### Task 1: Package scaffolding

**Files:**
- Create: `packages/background-tasks/package.json`
- Create: `packages/background-tasks/tsconfig.json`
- Create: `packages/background-tasks/tsconfig.build.json`
- Create: `packages/background-tasks/src/index.ts`
- Create: `packages/background-tasks/src/api/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
    "name": "@webiny/background-tasks",
    "version": "0.0.0",
    "type": "module",
    "exports": {
        ".": "./index.js",
        "./api": "./api/index.js",
        "./admin/*": "./admin/*",
        "./*": "./*"
    },
    "description": "Background Tasks feature for Webiny",
    "keywords": [
        "background-tasks:base"
    ],
    "repository": {
        "type": "git",
        "url": "https://github.com/webiny/webiny-js.git",
        "directory": "packages/background-tasks"
    },
    "license": "MIT",
    "dependencies": {
        "@webiny/admin-ui": "0.0.0",
        "@webiny/app": "0.0.0",
        "@webiny/app-admin": "0.0.0",
        "@webiny/feature": "0.0.0",
        "@webiny/icons": "0.0.0",
        "@webiny/sdk": "0.0.0",
        "mobx": "^6.15.3",
        "mobx-react-lite": "^4.1.1",
        "react": "18.3.1",
        "react-dom": "18.3.1"
    },
    "devDependencies": {
        "@webiny/build-tools": "0.0.0",
        "@webiny/project-utils": "0.0.0",
        "typescript": "6.0.3"
    },
    "publishConfig": {
        "access": "public",
        "directory": "dist"
    }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
    "extends": "../../tsconfig.json",
    "include": ["src"],
    "references": [
        { "path": "../admin-ui" },
        { "path": "../app" },
        { "path": "../app-admin" },
        { "path": "../feature" },
        { "path": "../sdk" }
    ],
    "compilerOptions": {
        "rootDirs": ["./src"],
        "outDir": "./dist",
        "declarationDir": "./dist",
        "paths": {
            "~/*": ["./src/*"],
            "@webiny/admin-ui/*": ["../admin-ui/src/*"],
            "@webiny/admin-ui": ["../admin-ui/src"],
            "@webiny/app/*": ["../app/src/*"],
            "@webiny/app": ["../app/src"],
            "@webiny/app-admin/*": ["../app-admin/src/*"],
            "@webiny/app-admin": ["../app-admin/src"],
            "@webiny/feature/admin": ["../feature/src/admin/index.js"],
            "@webiny/feature/*": ["../feature/src/*"],
            "@webiny/feature": ["../feature/src"],
            "@webiny/sdk/*": ["../sdk/src/*"],
            "@webiny/sdk": ["../sdk/src"]
        }
    }
}
```

- [ ] **Step 3: Create tsconfig.build.json**

```json
{
    "extends": "../../tsconfig.build.json",
    "include": ["src"],
    "references": [
        { "path": "../admin-ui/tsconfig.build.json" },
        { "path": "../app/tsconfig.build.json" },
        { "path": "../app-admin/tsconfig.build.json" },
        { "path": "../feature/tsconfig.build.json" },
        { "path": "../sdk/tsconfig.build.json" }
    ],
    "compilerOptions": {
        "rootDir": "./src",
        "outDir": "./dist",
        "declarationDir": "./dist",
        "paths": {
            "~/*": ["./src/*"],
            "@webiny/admin-ui/*": ["../admin-ui/src/*"],
            "@webiny/admin-ui": ["../admin-ui/src"],
            "@webiny/app/*": ["../app/src/*"],
            "@webiny/app": ["../app/src"],
            "@webiny/app-admin/*": ["../app-admin/src/*"],
            "@webiny/app-admin": ["../app-admin/src"],
            "@webiny/feature/admin": ["../feature/src/admin/index.js"],
            "@webiny/feature/*": ["../feature/src/*"],
            "@webiny/feature": ["../feature/src"],
            "@webiny/sdk/*": ["../sdk/src/*"],
            "@webiny/sdk": ["../sdk/src"]
        }
    }
}
```

- [ ] **Step 4: Create src/index.ts**

```typescript
export * from "./admin/index.js";
```

- [ ] **Step 5: Create src/api/index.ts**

```typescript
// API features will be added in a future iteration.
```

- [ ] **Step 6: Commit**

```bash
git add packages/background-tasks/
git commit -m "feat(background-tasks): scaffold package structure"
```

---

### Task 2: Shared types, permissions, and routes

**Files:**
- Create: `packages/background-tasks/src/admin/shared/types.ts`
- Create: `packages/background-tasks/src/admin/permissions.ts`
- Create: `packages/background-tasks/src/admin/routes.ts`
- Create: `packages/background-tasks/src/admin/features/permissions/abstractions.ts`
- Create: `packages/background-tasks/src/admin/features/permissions/feature.ts`
- Create: `packages/background-tasks/src/admin/features/permissions/index.ts`
- Create: `packages/background-tasks/src/admin/presentation/security/HasPermission.tsx`
- Create: `packages/background-tasks/src/admin/presentation/security/usePermissions.ts`

- [ ] **Step 1: Create shared types**

File: `packages/background-tasks/src/admin/shared/types.ts`

```typescript
export type { TaskRun as Task } from "@webiny/sdk";
export type { TaskLog } from "@webiny/sdk";
export type { TaskLogItem } from "@webiny/sdk";
export type { TaskDefinition } from "@webiny/sdk";
export type { TaskStatus } from "@webiny/sdk";
```

- [ ] **Step 2: Create permissions schema**

File: `packages/background-tasks/src/admin/permissions.ts`

```typescript
import { createPermissionSchema } from "@webiny/app-admin";

export const BACKGROUND_TASK_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "backgroundTasks",
    fullAccess: true,
    entities: [
        {
            id: "task",
            permission: "backgroundTasks.task",
            scopes: ["full"],
            actions: [{ name: "rwd" }]
        }
    ]
});
```

- [ ] **Step 3: Create permissions feature**

File: `packages/background-tasks/src/admin/features/permissions/abstractions.ts`

```typescript
import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

export const TaskPermissions = createPermissionsAbstraction(BACKGROUND_TASK_PERMISSIONS_SCHEMA);

export namespace TaskPermissions {
    export type Interface = Permissions<typeof BACKGROUND_TASK_PERMISSIONS_SCHEMA>;
}
```

File: `packages/background-tasks/src/admin/features/permissions/feature.ts`

```typescript
import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";
import { TaskPermissions } from "./abstractions.js";

export const TaskPermissionsFeature = createPermissionsFeature(
    BACKGROUND_TASK_PERMISSIONS_SCHEMA,
    TaskPermissions
);
```

File: `packages/background-tasks/src/admin/features/permissions/index.ts`

```typescript
export { TaskPermissions } from "./abstractions.js";
export { TaskPermissionsFeature } from "./feature.js";
```

- [ ] **Step 4: Create security presentation helpers**

File: `packages/background-tasks/src/admin/presentation/security/HasPermission.tsx`

```typescript
import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { TaskPermissions } from "~/admin/features/permissions/abstractions.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

export const HasPermission =
    createHasPermission<typeof BACKGROUND_TASK_PERMISSIONS_SCHEMA>(TaskPermissions);
```

File: `packages/background-tasks/src/admin/presentation/security/usePermissions.ts`

```typescript
import { createUsePermissions } from "@webiny/app-admin/exports/admin/security.js";
import { TaskPermissions } from "~/admin/features/permissions/abstractions.js";

export const usePermissions = createUsePermissions(TaskPermissions);
```

- [ ] **Step 5: Create routes**

File: `packages/background-tasks/src/admin/routes.ts`

```typescript
import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "BackgroundTasks/List",
        path: "/background-tasks"
    })
};
```

- [ ] **Step 6: Commit**

```bash
git add packages/background-tasks/
git commit -m "feat(background-tasks): add shared types, permissions, and routes"
```

---

### Task 3: listTasks feature

**Files:**
- Create: `packages/background-tasks/src/admin/features/listTasks/abstractions.ts`
- Create: `packages/background-tasks/src/admin/features/listTasks/ListTasksUseCase.ts`
- Create: `packages/background-tasks/src/admin/features/listTasks/ListTasksGateway.ts`
- Create: `packages/background-tasks/src/admin/features/listTasks/feature.ts`
- Create: `packages/background-tasks/src/admin/features/listTasks/index.ts`

- [ ] **Step 1: Create abstractions**

File: `packages/background-tasks/src/admin/features/listTasks/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";

export interface IListTasksInput {
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListTasksMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListTasksOutput {
    items: Task[];
    meta: IListTasksMeta;
}

export interface IListTasksGateway {
    execute(input: IListTasksInput): Promise<IListTasksOutput>;
}

export const ListTasksGateway = createAbstraction<IListTasksGateway>("ListTasksGateway");

export namespace ListTasksGateway {
    export type Interface = IListTasksGateway;
}

export interface IListTasksUseCase {
    execute(input: IListTasksInput): Promise<IListTasksOutput>;
}

export const ListTasksUseCase = createAbstraction<IListTasksUseCase>("ListTasksUseCase");

export namespace ListTasksUseCase {
    export type Interface = IListTasksUseCase;
}
```

- [ ] **Step 2: Create gateway**

File: `packages/background-tasks/src/admin/features/listTasks/ListTasksGateway.ts`

```typescript
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    ListTasksGateway as GatewayAbstraction,
    type IListTasksInput,
    type IListTasksOutput
} from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

const LIST_TASKS = /* GraphQL */ `
    query ListTasks(
        $where: WebinyBackgroundTaskListWhereInput
        $sort: [WebinyBackgroundTaskListSorter!]
        $limit: Int
        $after: String
        $search: String
    ) {
        backgroundTasks {
            listTasks(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
                data {
                    id
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                    name
                    definitionId
                    parentId
                    executionName
                    iterations
                    input
                    output
                    taskStatus
                    startedOn
                    finishedOn
                    eventResponse
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type ListTasksResponse = {
    backgroundTasks: {
        listTasks:
            | {
                  data: Task[];
                  meta: { cursor: string | null; hasMoreItems: boolean; totalCount: number };
                  error: null;
              }
            | {
                  data: null;
                  meta: null;
                  error: { code: string; message: string; data: unknown };
              };
    };
};

class ListTasksGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(input: IListTasksInput): Promise<IListTasksOutput> {
        const response = await this.client.execute<ListTasksResponse>({
            query: LIST_TASKS,
            variables: {
                where: input.where,
                sort: input.sort,
                limit: input.limit,
                after: input.after,
                search: input.search
            }
        });

        const envelope = response.backgroundTasks.listTasks;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return {
            items: envelope.data,
            meta: envelope.meta
        };
    }
}

export const ListTasksGateway = GatewayAbstraction.createImplementation({
    implementation: ListTasksGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
```

- [ ] **Step 3: Create use case**

File: `packages/background-tasks/src/admin/features/listTasks/ListTasksUseCase.ts`

```typescript
import {
    ListTasksGateway,
    ListTasksUseCase as UseCaseAbstraction,
    type IListTasksInput,
    type IListTasksOutput
} from "./abstractions.js";

class ListTasksUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListTasksGateway.Interface) {}

    async execute(input: IListTasksInput): Promise<IListTasksOutput> {
        return this.gateway.execute(input);
    }
}

export const ListTasksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListTasksUseCaseImpl,
    dependencies: [ListTasksGateway]
});
```

- [ ] **Step 4: Create feature and index**

File: `packages/background-tasks/src/admin/features/listTasks/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/admin";
import { ListTasksUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListTasksUseCase } from "./ListTasksUseCase.js";
import { ListTasksGateway } from "./ListTasksGateway.js";

export const ListTasksFeature = createFeature({
    name: "BackgroundTasks/ListTasks",
    register(container) {
        container.register(ListTasksUseCase);
        container.register(ListTasksGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

File: `packages/background-tasks/src/admin/features/listTasks/index.ts`

```typescript
export { ListTasksUseCase } from "./abstractions.js";
export { ListTasksFeature } from "./feature.js";
```

- [ ] **Step 5: Commit**

```bash
git add packages/background-tasks/src/admin/features/listTasks/
git commit -m "feat(background-tasks): add listTasks feature"
```

---

### Task 4: getTask feature

**Files:**
- Create: `packages/background-tasks/src/admin/features/getTask/abstractions.ts`
- Create: `packages/background-tasks/src/admin/features/getTask/GetTaskUseCase.ts`
- Create: `packages/background-tasks/src/admin/features/getTask/GetTaskGateway.ts`
- Create: `packages/background-tasks/src/admin/features/getTask/feature.ts`
- Create: `packages/background-tasks/src/admin/features/getTask/index.ts`

- [ ] **Step 1: Create abstractions**

File: `packages/background-tasks/src/admin/features/getTask/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";

export interface IGetTaskGateway {
    execute(id: string): Promise<Task>;
}

export const GetTaskGateway = createAbstraction<IGetTaskGateway>("GetTaskGateway");

export namespace GetTaskGateway {
    export type Interface = IGetTaskGateway;
}

export interface IGetTaskUseCase {
    execute(id: string): Promise<Task>;
}

export const GetTaskUseCase = createAbstraction<IGetTaskUseCase>("GetTaskUseCase");

export namespace GetTaskUseCase {
    export type Interface = IGetTaskUseCase;
}
```

- [ ] **Step 2: Create gateway**

File: `packages/background-tasks/src/admin/features/getTask/GetTaskGateway.ts`

```typescript
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { GetTaskGateway as GatewayAbstraction } from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

const GET_TASK = /* GraphQL */ `
    query GetTask($id: ID!) {
        backgroundTasks {
            getTask(id: $id) {
                data {
                    id
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                    name
                    definitionId
                    parentId
                    executionName
                    iterations
                    input
                    output
                    taskStatus
                    startedOn
                    finishedOn
                    eventResponse
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type GetTaskResponse = {
    backgroundTasks: {
        getTask:
            | { data: Task; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class GetTaskGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<Task> {
        const response = await this.client.execute<GetTaskResponse>({
            query: GET_TASK,
            variables: { id }
        });

        const envelope = response.backgroundTasks.getTask;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const GetTaskGateway = GatewayAbstraction.createImplementation({
    implementation: GetTaskGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
```

- [ ] **Step 3: Create use case, feature, index**

File: `packages/background-tasks/src/admin/features/getTask/GetTaskUseCase.ts`

```typescript
import { GetTaskGateway, GetTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

class GetTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: GetTaskGateway.Interface) {}

    async execute(id: string): Promise<Task> {
        return this.gateway.execute(id);
    }
}

export const GetTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTaskUseCaseImpl,
    dependencies: [GetTaskGateway]
});
```

File: `packages/background-tasks/src/admin/features/getTask/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/admin";
import { GetTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTaskUseCase } from "./GetTaskUseCase.js";
import { GetTaskGateway } from "./GetTaskGateway.js";

export const GetTaskFeature = createFeature({
    name: "BackgroundTasks/GetTask",
    register(container) {
        container.register(GetTaskUseCase);
        container.register(GetTaskGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

File: `packages/background-tasks/src/admin/features/getTask/index.ts`

```typescript
export { GetTaskUseCase } from "./abstractions.js";
export { GetTaskFeature } from "./feature.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/background-tasks/src/admin/features/getTask/
git commit -m "feat(background-tasks): add getTask feature"
```

---

### Task 5: deleteTask feature

**Files:**
- Create: `packages/background-tasks/src/admin/features/deleteTask/abstractions.ts`
- Create: `packages/background-tasks/src/admin/features/deleteTask/DeleteTaskUseCase.ts`
- Create: `packages/background-tasks/src/admin/features/deleteTask/DeleteTaskGateway.ts`
- Create: `packages/background-tasks/src/admin/features/deleteTask/feature.ts`
- Create: `packages/background-tasks/src/admin/features/deleteTask/index.ts`

- [ ] **Step 1: Create abstractions**

File: `packages/background-tasks/src/admin/features/deleteTask/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteTaskGateway {
    execute(id: string): Promise<boolean>;
}

export const DeleteTaskGateway = createAbstraction<IDeleteTaskGateway>("DeleteTaskGateway");

export namespace DeleteTaskGateway {
    export type Interface = IDeleteTaskGateway;
}

export interface IDeleteTaskUseCase {
    execute(id: string): Promise<boolean>;
}

export const DeleteTaskUseCase = createAbstraction<IDeleteTaskUseCase>("DeleteTaskUseCase");

export namespace DeleteTaskUseCase {
    export type Interface = IDeleteTaskUseCase;
}
```

- [ ] **Step 2: Create gateway**

File: `packages/background-tasks/src/admin/features/deleteTask/DeleteTaskGateway.ts`

```typescript
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { DeleteTaskGateway as GatewayAbstraction } from "./abstractions.js";

const DELETE_TASK = /* GraphQL */ `
    mutation DeleteTask($id: ID!) {
        backgroundTasks {
            deleteTask(id: $id) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type DeleteTaskResponse = {
    backgroundTasks: {
        deleteTask:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class DeleteTaskGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<boolean> {
        const response = await this.client.execute<DeleteTaskResponse>({
            query: DELETE_TASK,
            variables: { id }
        });

        const envelope = response.backgroundTasks.deleteTask;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const DeleteTaskGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteTaskGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
```

- [ ] **Step 3: Create use case, feature, index**

File: `packages/background-tasks/src/admin/features/deleteTask/DeleteTaskUseCase.ts`

```typescript
import { DeleteTaskGateway, DeleteTaskUseCase as UseCaseAbstraction } from "./abstractions.js";

class DeleteTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: DeleteTaskGateway.Interface) {}

    async execute(id: string): Promise<boolean> {
        return this.gateway.execute(id);
    }
}

export const DeleteTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteTaskUseCaseImpl,
    dependencies: [DeleteTaskGateway]
});
```

File: `packages/background-tasks/src/admin/features/deleteTask/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/admin";
import { DeleteTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteTaskUseCase } from "./DeleteTaskUseCase.js";
import { DeleteTaskGateway } from "./DeleteTaskGateway.js";

export const DeleteTaskFeature = createFeature({
    name: "BackgroundTasks/DeleteTask",
    register(container) {
        container.register(DeleteTaskUseCase);
        container.register(DeleteTaskGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

File: `packages/background-tasks/src/admin/features/deleteTask/index.ts`

```typescript
export { DeleteTaskUseCase } from "./abstractions.js";
export { DeleteTaskFeature } from "./feature.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/background-tasks/src/admin/features/deleteTask/
git commit -m "feat(background-tasks): add deleteTask feature"
```

---

### Task 6: abortTask feature

**Files:**
- Create: `packages/background-tasks/src/admin/features/abortTask/abstractions.ts`
- Create: `packages/background-tasks/src/admin/features/abortTask/AbortTaskUseCase.ts`
- Create: `packages/background-tasks/src/admin/features/abortTask/AbortTaskGateway.ts`
- Create: `packages/background-tasks/src/admin/features/abortTask/feature.ts`
- Create: `packages/background-tasks/src/admin/features/abortTask/index.ts`

- [ ] **Step 1: Create abstractions**

File: `packages/background-tasks/src/admin/features/abortTask/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";

export interface IAbortTaskInput {
    id: string;
    message?: string;
}

export interface IAbortTaskGateway {
    execute(input: IAbortTaskInput): Promise<Task>;
}

export const AbortTaskGateway = createAbstraction<IAbortTaskGateway>("AbortTaskGateway");

export namespace AbortTaskGateway {
    export type Interface = IAbortTaskGateway;
}

export interface IAbortTaskUseCase {
    execute(input: IAbortTaskInput): Promise<Task>;
}

export const AbortTaskUseCase = createAbstraction<IAbortTaskUseCase>("AbortTaskUseCase");

export namespace AbortTaskUseCase {
    export type Interface = IAbortTaskUseCase;
}
```

- [ ] **Step 2: Create gateway**

File: `packages/background-tasks/src/admin/features/abortTask/AbortTaskGateway.ts`

```typescript
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { AbortTaskGateway as GatewayAbstraction, type IAbortTaskInput } from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

const ABORT_TASK = /* GraphQL */ `
    mutation AbortTask($id: ID!, $message: String) {
        backgroundTasks {
            abortTask(id: $id, message: $message) {
                data {
                    id
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                    name
                    definitionId
                    parentId
                    executionName
                    iterations
                    input
                    output
                    taskStatus
                    startedOn
                    finishedOn
                    eventResponse
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type AbortTaskResponse = {
    backgroundTasks: {
        abortTask:
            | { data: Task; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class AbortTaskGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(input: IAbortTaskInput): Promise<Task> {
        const response = await this.client.execute<AbortTaskResponse>({
            query: ABORT_TASK,
            variables: { id: input.id, message: input.message }
        });

        const envelope = response.backgroundTasks.abortTask;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const AbortTaskGateway = GatewayAbstraction.createImplementation({
    implementation: AbortTaskGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
```

- [ ] **Step 3: Create use case, feature, index**

File: `packages/background-tasks/src/admin/features/abortTask/AbortTaskUseCase.ts`

```typescript
import {
    AbortTaskGateway,
    AbortTaskUseCase as UseCaseAbstraction,
    type IAbortTaskInput
} from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

class AbortTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: AbortTaskGateway.Interface) {}

    async execute(input: IAbortTaskInput): Promise<Task> {
        return this.gateway.execute(input);
    }
}

export const AbortTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: AbortTaskUseCaseImpl,
    dependencies: [AbortTaskGateway]
});
```

File: `packages/background-tasks/src/admin/features/abortTask/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/admin";
import { AbortTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AbortTaskUseCase } from "./AbortTaskUseCase.js";
import { AbortTaskGateway } from "./AbortTaskGateway.js";

export const AbortTaskFeature = createFeature({
    name: "BackgroundTasks/AbortTask",
    register(container) {
        container.register(AbortTaskUseCase);
        container.register(AbortTaskGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

File: `packages/background-tasks/src/admin/features/abortTask/index.ts`

```typescript
export { AbortTaskUseCase } from "./abstractions.js";
export { AbortTaskFeature } from "./feature.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/background-tasks/src/admin/features/abortTask/
git commit -m "feat(background-tasks): add abortTask feature"
```

---

### Task 7: listLogs feature

**Files:**
- Create: `packages/background-tasks/src/admin/features/listLogs/abstractions.ts`
- Create: `packages/background-tasks/src/admin/features/listLogs/ListLogsUseCase.ts`
- Create: `packages/background-tasks/src/admin/features/listLogs/ListLogsGateway.ts`
- Create: `packages/background-tasks/src/admin/features/listLogs/feature.ts`
- Create: `packages/background-tasks/src/admin/features/listLogs/index.ts`

- [ ] **Step 1: Create abstractions**

File: `packages/background-tasks/src/admin/features/listLogs/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { TaskLog } from "~/admin/shared/types.js";

export interface IListLogsInput {
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface IListLogsMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListLogsOutput {
    items: TaskLog[];
    meta: IListLogsMeta;
}

export interface IListLogsGateway {
    execute(input: IListLogsInput): Promise<IListLogsOutput>;
}

export const ListLogsGateway = createAbstraction<IListLogsGateway>("ListLogsGateway");

export namespace ListLogsGateway {
    export type Interface = IListLogsGateway;
}

export interface IListLogsUseCase {
    execute(input: IListLogsInput): Promise<IListLogsOutput>;
}

export const ListLogsUseCase = createAbstraction<IListLogsUseCase>("ListLogsUseCase");

export namespace ListLogsUseCase {
    export type Interface = IListLogsUseCase;
}
```

- [ ] **Step 2: Create gateway**

File: `packages/background-tasks/src/admin/features/listLogs/ListLogsGateway.ts`

```typescript
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    ListLogsGateway as GatewayAbstraction,
    type IListLogsInput,
    type IListLogsOutput
} from "./abstractions.js";
import type { TaskLog } from "~/admin/shared/types.js";

const LIST_LOGS = /* GraphQL */ `
    query ListBackgroundTaskLogs(
        $where: WebinyBackgroundTaskLogListWhereInput
        $sort: [WebinyBackgroundTaskLogListSorter!]
        $limit: Int
        $after: String
    ) {
        backgroundTasks {
            listLogs(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    createdOn
                    executionName
                    iteration
                    items {
                        message
                        createdOn
                        type
                        data
                        error
                    }
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type ListLogsResponse = {
    backgroundTasks: {
        listLogs:
            | {
                  data: TaskLog[];
                  meta: { cursor: string | null; hasMoreItems: boolean; totalCount: number };
                  error: null;
              }
            | {
                  data: null;
                  meta: null;
                  error: { code: string; message: string; data: unknown };
              };
    };
};

class ListLogsGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(input: IListLogsInput): Promise<IListLogsOutput> {
        const response = await this.client.execute<ListLogsResponse>({
            query: LIST_LOGS,
            variables: {
                where: input.where,
                sort: input.sort,
                limit: input.limit,
                after: input.after
            }
        });

        const envelope = response.backgroundTasks.listLogs;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return {
            items: envelope.data,
            meta: envelope.meta
        };
    }
}

export const ListLogsGateway = GatewayAbstraction.createImplementation({
    implementation: ListLogsGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
```

- [ ] **Step 3: Create use case, feature, index**

File: `packages/background-tasks/src/admin/features/listLogs/ListLogsUseCase.ts`

```typescript
import {
    ListLogsGateway,
    ListLogsUseCase as UseCaseAbstraction,
    type IListLogsInput,
    type IListLogsOutput
} from "./abstractions.js";

class ListLogsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListLogsGateway.Interface) {}

    async execute(input: IListLogsInput): Promise<IListLogsOutput> {
        return this.gateway.execute(input);
    }
}

export const ListLogsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLogsUseCaseImpl,
    dependencies: [ListLogsGateway]
});
```

File: `packages/background-tasks/src/admin/features/listLogs/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/admin";
import { ListLogsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListLogsUseCase } from "./ListLogsUseCase.js";
import { ListLogsGateway } from "./ListLogsGateway.js";

export const ListLogsFeature = createFeature({
    name: "BackgroundTasks/ListLogs",
    register(container) {
        container.register(ListLogsUseCase);
        container.register(ListLogsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

File: `packages/background-tasks/src/admin/features/listLogs/index.ts`

```typescript
export { ListLogsUseCase } from "./abstractions.js";
export { ListLogsFeature } from "./feature.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/background-tasks/src/admin/features/listLogs/
git commit -m "feat(background-tasks): add listLogs feature"
```

---

### Task 8: listDefinitions feature

**Files:**
- Create: `packages/background-tasks/src/admin/features/listDefinitions/abstractions.ts`
- Create: `packages/background-tasks/src/admin/features/listDefinitions/ListDefinitionsUseCase.ts`
- Create: `packages/background-tasks/src/admin/features/listDefinitions/ListDefinitionsGateway.ts`
- Create: `packages/background-tasks/src/admin/features/listDefinitions/feature.ts`
- Create: `packages/background-tasks/src/admin/features/listDefinitions/index.ts`

- [ ] **Step 1: Create abstractions**

File: `packages/background-tasks/src/admin/features/listDefinitions/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { TaskDefinition } from "~/admin/shared/types.js";

export interface IListDefinitionsGateway {
    execute(): Promise<TaskDefinition[]>;
}

export const ListDefinitionsGateway =
    createAbstraction<IListDefinitionsGateway>("ListDefinitionsGateway");

export namespace ListDefinitionsGateway {
    export type Interface = IListDefinitionsGateway;
}

export interface IListDefinitionsUseCase {
    execute(): Promise<TaskDefinition[]>;
}

export const ListDefinitionsUseCase =
    createAbstraction<IListDefinitionsUseCase>("ListDefinitionsUseCase");

export namespace ListDefinitionsUseCase {
    export type Interface = IListDefinitionsUseCase;
}
```

- [ ] **Step 2: Create gateway**

File: `packages/background-tasks/src/admin/features/listDefinitions/ListDefinitionsGateway.ts`

```typescript
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { ListDefinitionsGateway as GatewayAbstraction } from "./abstractions.js";
import type { TaskDefinition } from "~/admin/shared/types.js";

const LIST_DEFINITIONS = /* GraphQL */ `
    query ListTaskDefinitions {
        backgroundTasks {
            listDefinitions {
                data {
                    id
                    title
                    description
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type ListDefinitionsResponse = {
    backgroundTasks: {
        listDefinitions:
            | { data: TaskDefinition[]; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class ListDefinitionsGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<TaskDefinition[]> {
        const response = await this.client.execute<ListDefinitionsResponse>({
            query: LIST_DEFINITIONS
        });

        const envelope = response.backgroundTasks.listDefinitions;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const ListDefinitionsGateway = GatewayAbstraction.createImplementation({
    implementation: ListDefinitionsGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
```

- [ ] **Step 3: Create use case, feature, index**

File: `packages/background-tasks/src/admin/features/listDefinitions/ListDefinitionsUseCase.ts`

```typescript
import {
    ListDefinitionsGateway,
    ListDefinitionsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import type { TaskDefinition } from "~/admin/shared/types.js";

class ListDefinitionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListDefinitionsGateway.Interface) {}

    async execute(): Promise<TaskDefinition[]> {
        return this.gateway.execute();
    }
}

export const ListDefinitionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListDefinitionsUseCaseImpl,
    dependencies: [ListDefinitionsGateway]
});
```

File: `packages/background-tasks/src/admin/features/listDefinitions/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/admin";
import { ListDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListDefinitionsUseCase } from "./ListDefinitionsUseCase.js";
import { ListDefinitionsGateway } from "./ListDefinitionsGateway.js";

export const ListDefinitionsFeature = createFeature({
    name: "BackgroundTasks/ListDefinitions",
    register(container) {
        container.register(ListDefinitionsUseCase);
        container.register(ListDefinitionsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

File: `packages/background-tasks/src/admin/features/listDefinitions/index.ts`

```typescript
export { ListDefinitionsUseCase } from "./abstractions.js";
export { ListDefinitionsFeature } from "./feature.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/background-tasks/src/admin/features/listDefinitions/
git commit -m "feat(background-tasks): add listDefinitions feature"
```

---

### Task 9: TaskList presentation (presenter + data source)

**Files:**
- Create: `packages/background-tasks/src/admin/presentation/TaskList/abstractions.ts`
- Create: `packages/background-tasks/src/admin/presentation/TaskList/TaskListDataSource.ts`
- Create: `packages/background-tasks/src/admin/presentation/TaskList/TaskListPresenter.ts`
- Create: `packages/background-tasks/src/admin/presentation/TaskList/feature.ts`
- Create: `packages/background-tasks/src/admin/presentation/TaskList/index.ts`

- [ ] **Step 1: Create abstractions**

File: `packages/background-tasks/src/admin/presentation/TaskList/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface ITaskListViewModel {
    list: IListViewModel<Task>;
    permissions: {
        canRead: boolean;
        canDelete: boolean;
    };
}

export interface ITaskListActions extends IListActions {
    deleteTask(id: string): Promise<void>;
    abortTask(id: string): Promise<void>;
    selectTask(task: Task | null): void;
}

export interface ITaskListPresenter {
    vm: ITaskListViewModel;
    actions: ITaskListActions;
    selectedTask: Task | null;
    init(): void;
}

export const TaskListPresenter = createAbstraction<ITaskListPresenter>("TaskListPresenter");

export namespace TaskListPresenter {
    export type Interface = ITaskListPresenter;
    export type ViewModel = ITaskListViewModel;
    export type Actions = ITaskListActions;
}
```

- [ ] **Step 2: Create data source**

File: `packages/background-tasks/src/admin/presentation/TaskList/TaskListDataSource.ts`

```typescript
import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Task } from "~/admin/shared/types.js";
import type { IListTasksUseCase } from "~/admin/features/listTasks/abstractions.js";

export class TaskListDataSource implements IDataSource<Task> {
    private _rows: Task[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(private readonly listTasksUseCase: IListTasksUseCase) {
        makeAutoObservable<TaskListDataSource, "listTasksUseCase">(this, {
            listTasksUseCase: false,
            rows: computed
        });
    }

    get rows(): Task[] {
        return this._rows;
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;
        const sort = params.sort
            ? [`${params.sort.field}_${params.sort.direction}`]
            : undefined;
        const result = await this.listTasksUseCase.execute({
            where: params.filters as Record<string, unknown> | undefined,
            sort,
            limit: params.limit,
            after: params.cursor,
            search: params.search
        });
        runInAction(() => {
            this._rows = result.items;
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }

    async loadMore(params: IDataSourceQuery): Promise<void> {
        if (!this._meta.hasMoreItems || this._loading) {
            return;
        }
        this._loading = true;
        const sort = params.sort
            ? [`${params.sort.field}_${params.sort.direction}`]
            : undefined;
        const result = await this.listTasksUseCase.execute({
            where: params.filters as Record<string, unknown> | undefined,
            sort,
            limit: params.limit,
            after: this._meta.cursor ?? undefined,
            search: params.search
        });
        runInAction(() => {
            this._rows = [...this._rows, ...result.items];
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }
}
```

- [ ] **Step 3: Create presenter**

File: `packages/background-tasks/src/admin/presentation/TaskList/TaskListPresenter.ts`

```typescript
import { makeAutoObservable, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Task } from "~/admin/shared/types.js";
import {
    TaskListPresenter as Abstraction,
    type ITaskListPresenter,
    type ITaskListViewModel,
    type ITaskListActions
} from "./abstractions.js";
import { TaskListDataSource } from "./TaskListDataSource.js";
import { ListTasksUseCase } from "~/admin/features/listTasks/abstractions.js";
import { DeleteTaskUseCase } from "~/admin/features/deleteTask/abstractions.js";
import { AbortTaskUseCase } from "~/admin/features/abortTask/abstractions.js";
import { TaskPermissions } from "~/admin/features/permissions/abstractions.js";

class TaskListPresenterImpl implements ITaskListPresenter {
    private _selectedTask: Task | null = null;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<Task>,
        private readonly listTasksUseCase: ListTasksUseCase.Interface,
        private readonly deleteTaskUseCase: DeleteTaskUseCase.Interface,
        private readonly abortTaskUseCase: AbortTaskUseCase.Interface,
        private readonly permissions: TaskPermissions.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ITaskListViewModel {
        return {
            list: this.listPresenter.vm,
            permissions: {
                canRead: this.permissions.canRead("task"),
                canDelete: this.permissions.canDelete("task")
            }
        };
    }

    get selectedTask(): Task | null {
        return this._selectedTask;
    }

    actions: ITaskListActions = {
        search: {
            set: (query: string) => this.listPresenter.actions.search.set(query),
            clear: () => this.listPresenter.actions.search.clear()
        },
        sort: {
            set: (field: string, direction: "ASC" | "DESC") =>
                this.listPresenter.actions.sort.set(field, direction),
            toggle: (field: string) => this.listPresenter.actions.sort.toggle(field)
        },
        filter: {
            set: (key: string, value: unknown) => this.listPresenter.actions.filter.set(key, value),
            clear: (key: string) => this.listPresenter.actions.filter.clear(key),
            clearAll: () => this.listPresenter.actions.filter.clearAll()
        },
        selection: {
            toggle: (id: string) => this.listPresenter.actions.selection.toggle(id),
            selectRangeTo: (id: string) => this.listPresenter.actions.selection.selectRangeTo(id),
            selectAll: () => this.listPresenter.actions.selection.selectAll(),
            deselectAll: () => this.listPresenter.actions.selection.deselectAll(),
            selectRows: (ids: string[]) => this.listPresenter.actions.selection.selectRows(ids),
            isSelected: (id: string) => this.listPresenter.actions.selection.isSelected(id)
        },
        loadMore: () => this.listPresenter.actions.loadMore(),
        refresh: () => this.listPresenter.actions.refresh(),
        deleteTask: async (id: string) => {
            await this.deleteTaskUseCase.execute(id);
            this._selectedTask = null;
            await this.listPresenter.actions.refresh();
        },
        abortTask: async (id: string) => {
            await this.abortTaskUseCase.execute({ id });
            await this.listPresenter.actions.refresh();
        },
        selectTask: (task: Task | null) => {
            this._selectedTask = task;
        }
    };

    init(): void {
        const dataSource = new TaskListDataSource(this.listTasksUseCase);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }
}

export const TaskListPresenter = Abstraction.createImplementation({
    implementation: TaskListPresenterImpl,
    dependencies: [
        ListPresenter,
        ListTasksUseCase,
        DeleteTaskUseCase,
        AbortTaskUseCase,
        TaskPermissions
    ]
});
```

- [ ] **Step 4: Create feature and index**

File: `packages/background-tasks/src/admin/presentation/TaskList/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/admin";
import { TaskListPresenter as PresenterAbstraction } from "./abstractions.js";
import { TaskListPresenter } from "./TaskListPresenter.js";

export const TaskListPresenterFeature = createFeature({
    name: "BackgroundTasks/TaskListPresenter",
    register(container) {
        container.register(TaskListPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
```

File: `packages/background-tasks/src/admin/presentation/TaskList/index.ts`

```typescript
export { TaskListPresenter } from "./abstractions.js";
export { TaskListPresenterFeature } from "./feature.js";
```

- [ ] **Step 5: Commit**

```bash
git add packages/background-tasks/src/admin/presentation/TaskList/
git commit -m "feat(background-tasks): add TaskList presenter and data source"
```

---

### Task 10: TaskListView component

**Files:**
- Create: `packages/background-tasks/src/admin/presentation/TaskList/components/TaskListView.tsx`

- [ ] **Step 1: Create the TaskListView component**

File: `packages/background-tasks/src/admin/presentation/TaskList/components/TaskListView.tsx`

```typescript
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import {
    Button,
    DataTable,
    DatePicker,
    DropdownMenu,
    Heading,
    IconButton,
    Input,
    Select,
    Separator,
    Tag,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as StopCircleIcon } from "@webiny/icons/stop_circle.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { TaskListPresenterFeature } from "../feature.js";
import { ListTasksFeature } from "~/admin/features/listTasks/feature.js";
import { DeleteTaskFeature } from "~/admin/features/deleteTask/feature.js";
import { AbortTaskFeature } from "~/admin/features/abortTask/feature.js";
import { ListDefinitionsFeature } from "~/admin/features/listDefinitions/feature.js";
import { TaskPermissionsFeature } from "~/admin/features/permissions/feature.js";
import type { Task } from "~/admin/shared/types.js";
import type { TaskStatus } from "~/admin/shared/types.js";
import { TaskDetailDrawer } from "~/admin/presentation/TaskDetail/components/TaskDetailDrawer.js";

const STATUS_TAG_VARIANT: Record<string, "neutral-light" | "accent" | "success" | "destructive" | "warning"> = {
    pending: "neutral-light",
    running: "accent",
    success: "success",
    failed: "destructive",
    aborted: "warning"
};

const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
    { label: "Pending", value: "pending" },
    { label: "Running", value: "running" },
    { label: "Success", value: "completed" },
    { label: "Failed", value: "failed" },
    { label: "Aborted", value: "aborted" }
];

const TaskListViewInner = observer(function TaskListViewInner() {
    const { presenter } = useFeature(TaskListPresenterFeature);
    const [definitions, setDefinitions] = useState<{ label: string; value: string }[]>([]);
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const listDefinitionsFeature = useFeature(ListDefinitionsFeature);

    useEffect(() => {
        void listDefinitionsFeature.useCase.execute().then(defs => {
            setDefinitions(defs.map(d => ({ label: d.title, value: d.id })));
        });
    }, [listDefinitionsFeature]);

    const { vm } = presenter;

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: "Delete Task",
        message: "Are you sure you want to delete this task?"
    });

    const { showConfirmation: showAbortConfirmation } = useConfirmationDialog({
        title: "Abort Task",
        message: "Are you sure you want to abort this running task?"
    });

    const sorting: DataTableSorting = useMemo(() => {
        const sort = vm.list.sort;
        if (!sort || !sort.field) {
            return [];
        }
        return [{ id: sort.field, desc: sort.direction === "DESC" }];
    }, [vm.list.sort]);

    const onSortingChange: OnDataTableSortingChange = useCallback(
        updater => {
            const next = typeof updater === "function" ? updater(sorting) : updater;
            if (next.length > 0) {
                const { id, desc } = next[0];
                presenter.actions.sort.set(id, desc ? "DESC" : "ASC");
            }
        },
        [sorting, presenter.actions.sort]
    );

    const columns = useMemo(
        () => ({
            name: {
                header: "Name",
                cell: (row: Task) => (
                    <Text
                        className="cursor-pointer text-primary hover:underline"
                        onClick={() => presenter.actions.selectTask(row)}
                    >
                        {row.name || row.definitionId}
                    </Text>
                ),
                enableSorting: true,
                size: 200
            },
            definitionId: {
                header: "Definition",
                cell: (row: Task) => {
                    const def = definitions.find(d => d.value === row.definitionId);
                    return <Text size="sm">{def ? def.label : row.definitionId}</Text>;
                },
                enableSorting: true,
                size: 160
            },
            taskStatus: {
                header: "Status",
                cell: (row: Task) => (
                    <Tag
                        variant={STATUS_TAG_VARIANT[row.taskStatus] ?? "neutral-light"}
                        content={row.taskStatus}
                    />
                ),
                enableSorting: true,
                size: 100
            },
            createdOn: {
                header: "Created",
                cell: (row: Task) =>
                    row.createdOn ? <TimeAgo datetime={row.createdOn} /> : <Text size="sm">—</Text>,
                enableSorting: true,
                size: 120
            },
            startedOn: {
                header: "Started",
                cell: (row: Task) =>
                    row.startedOn ? (
                        <TimeAgo datetime={row.startedOn} />
                    ) : (
                        <Text size="sm">—</Text>
                    ),
                enableSorting: true,
                size: 120
            },
            finishedOn: {
                header: "Finished",
                cell: (row: Task) =>
                    row.finishedOn ? (
                        <TimeAgo datetime={row.finishedOn} />
                    ) : (
                        <Text size="sm">—</Text>
                    ),
                enableSorting: true,
                size: 120
            },
            actions: {
                header: " ",
                cell: (row: Task) => {
                    const isRunning = row.taskStatus === "running";
                    const isTerminal =
                        row.taskStatus === "completed" ||
                        row.taskStatus === "failed" ||
                        row.taskStatus === "aborted";

                    if (!isRunning && !isTerminal) {
                        return null;
                    }

                    return (
                        <DropdownMenu
                            trigger={
                                <IconButton
                                    icon={<MoreVerticalIcon />}
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Actions"
                                />
                            }
                        >
                            {isRunning && (
                                <DropdownMenu.Item
                                    icon={<StopCircleIcon />}
                                    onClick={() => {
                                        showAbortConfirmation(() =>
                                            presenter.actions.abortTask(row.id).then(() => {
                                                showSnackbar("Task aborted.");
                                            })
                                        );
                                    }}
                                    text="Abort"
                                />
                            )}
                            {isTerminal && vm.permissions.canDelete && (
                                <>
                                    {isRunning && <DropdownMenu.Separator />}
                                    <DropdownMenu.Item
                                        icon={<DeleteIcon />}
                                        onClick={() => {
                                            showDeleteConfirmation(() =>
                                                presenter.actions.deleteTask(row.id).then(() => {
                                                    showSnackbar("Task deleted.");
                                                })
                                            );
                                        }}
                                        text="Delete"
                                    />
                                </>
                            )}
                        </DropdownMenu>
                    );
                },
                size: 56,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false
            }
        }),
        [
            vm.permissions,
            presenter.actions,
            definitions,
            showDeleteConfirmation,
            showAbortConfirmation,
            showSnackbar
        ]
    );

    return (
        <>
            <div className="flex flex-col h-main-content">
                <div className="flex items-center justify-between py-sm px-md">
                    <Heading level={5}>Background Tasks</Heading>
                </div>
                <Separator />
                <div className="flex items-center gap-sm px-md py-xs flex-wrap">
                    <div className="w-[240px]">
                        <Input
                            placeholder="Search by name..."
                            icon={<SearchIcon />}
                            size="sm"
                            value={vm.list.search}
                            onChange={e => presenter.actions.search.set(e.target.value)}
                        />
                    </div>
                    <div className="w-[160px]">
                        <Select
                            placeholder="Status"
                            size="sm"
                            options={STATUS_OPTIONS}
                            value={(vm.list.filters.taskStatus_in as string) ?? ""}
                            onChange={value => {
                                if (value) {
                                    presenter.actions.filter.set("taskStatus_in", value);
                                } else {
                                    presenter.actions.filter.clear("taskStatus_in");
                                }
                            }}
                        />
                    </div>
                    {definitions.length > 0 && (
                        <div className="w-[200px]">
                            <Select
                                placeholder="Definition"
                                size="sm"
                                options={definitions}
                                value={(vm.list.filters.definitionId as string) ?? ""}
                                onChange={value => {
                                    if (value) {
                                        presenter.actions.filter.set("definitionId", value);
                                    } else {
                                        presenter.actions.filter.clear("definitionId");
                                    }
                                }}
                            />
                        </div>
                    )}
                    <div className="w-[160px]">
                        <DatePicker
                            placeholder="Created from"
                            size="sm"
                            value={(vm.list.filters.createdOn_gte as string) ?? ""}
                            onChange={value => {
                                if (value) {
                                    presenter.actions.filter.set("createdOn_gte", value);
                                } else {
                                    presenter.actions.filter.clear("createdOn_gte");
                                }
                            }}
                        />
                    </div>
                    <div className="w-[160px]">
                        <DatePicker
                            placeholder="Created to"
                            size="sm"
                            value={(vm.list.filters.createdOn_lte as string) ?? ""}
                            onChange={value => {
                                if (value) {
                                    presenter.actions.filter.set("createdOn_lte", value);
                                } else {
                                    presenter.actions.filter.clear("createdOn_lte");
                                }
                            }}
                        />
                    </div>
                    {Object.keys(vm.list.filters).length > 0 && (
                        <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => presenter.actions.filter.clearAll()}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
                <Separator />
                <div className="flex-1 overflow-auto">
                    {!vm.list.pagination.loading && vm.list.rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-md">
                            <Text className="text-neutral-strong">No tasks found.</Text>
                        </div>
                    ) : (
                        <DataTable<Task>
                            columns={columns}
                            data={vm.list.rows}
                            loading={vm.list.pagination.loading}
                            sorting={sorting}
                            onSortingChange={onSortingChange}
                            stickyHeader
                        />
                    )}
                </div>
            </div>
            {presenter.selectedTask && (
                <TaskDetailDrawer
                    task={presenter.selectedTask}
                    open={!!presenter.selectedTask}
                    onClose={() => presenter.actions.selectTask(null)}
                    onAbort={async (id: string) => {
                        await presenter.actions.abortTask(id);
                        showSnackbar("Task aborted.");
                    }}
                    onDelete={async (id: string) => {
                        await presenter.actions.deleteTask(id);
                        showSnackbar("Task deleted.");
                    }}
                />
            )}
        </>
    );
});

export const TaskListView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListTasksFeature.register(child);
        DeleteTaskFeature.register(child);
        AbortTaskFeature.register(child);
        ListDefinitionsFeature.register(child);
        TaskPermissionsFeature.register(child);
        TaskListPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <TaskListViewInner />
        </DiContainerProvider>
    );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/background-tasks/src/admin/presentation/TaskList/components/
git commit -m "feat(background-tasks): add TaskListView component"
```

---

### Task 11: TaskDetail presentation (presenter + drawer)

**Files:**
- Create: `packages/background-tasks/src/admin/presentation/TaskDetail/abstractions.ts`
- Create: `packages/background-tasks/src/admin/presentation/TaskDetail/TaskDetailPresenter.ts`
- Create: `packages/background-tasks/src/admin/presentation/TaskDetail/TaskDetailDataSource.ts`
- Create: `packages/background-tasks/src/admin/presentation/TaskDetail/feature.ts`
- Create: `packages/background-tasks/src/admin/presentation/TaskDetail/index.ts`
- Create: `packages/background-tasks/src/admin/presentation/TaskDetail/components/TaskDetailDrawer.tsx`

- [ ] **Step 1: Create abstractions**

File: `packages/background-tasks/src/admin/presentation/TaskDetail/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { Task, TaskLog } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface ITaskDetailViewModel {
    task: Task | null;
    loading: boolean;
    logs: IListViewModel<TaskLog>;
}

export interface ITaskDetailActions extends IListActions {
    _noop?: never;
}

export interface ITaskDetailPresenter {
    vm: ITaskDetailViewModel;
    actions: ITaskDetailActions;
    init(taskId: string): void;
}

export const TaskDetailPresenter = createAbstraction<ITaskDetailPresenter>("TaskDetailPresenter");

export namespace TaskDetailPresenter {
    export type Interface = ITaskDetailPresenter;
    export type ViewModel = ITaskDetailViewModel;
    export type Actions = ITaskDetailActions;
}
```

- [ ] **Step 2: Create data source for logs**

File: `packages/background-tasks/src/admin/presentation/TaskDetail/TaskDetailDataSource.ts`

```typescript
import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { TaskLog } from "~/admin/shared/types.js";
import type { IListLogsUseCase } from "~/admin/features/listLogs/abstractions.js";

export class TaskDetailDataSource implements IDataSource<TaskLog> {
    private _rows: TaskLog[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(
        private readonly listLogsUseCase: IListLogsUseCase,
        private readonly taskId: string
    ) {
        makeAutoObservable<TaskDetailDataSource, "listLogsUseCase">(this, {
            listLogsUseCase: false,
            rows: computed
        });
    }

    get rows(): TaskLog[] {
        return this._rows;
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;
        const result = await this.listLogsUseCase.execute({
            where: { task: this.taskId },
            sort: ["createdOn_DESC"],
            limit: params.limit,
            after: params.cursor
        });
        runInAction(() => {
            this._rows = result.items;
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }

    async loadMore(params: IDataSourceQuery): Promise<void> {
        if (!this._meta.hasMoreItems || this._loading) {
            return;
        }
        this._loading = true;
        const result = await this.listLogsUseCase.execute({
            where: { task: this.taskId },
            sort: ["createdOn_DESC"],
            limit: params.limit,
            after: this._meta.cursor ?? undefined
        });
        runInAction(() => {
            this._rows = [...this._rows, ...result.items];
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }
}
```

- [ ] **Step 3: Create presenter**

File: `packages/background-tasks/src/admin/presentation/TaskDetail/TaskDetailPresenter.ts`

```typescript
import { makeAutoObservable, runInAction, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Task, TaskLog } from "~/admin/shared/types.js";
import {
    TaskDetailPresenter as Abstraction,
    type ITaskDetailPresenter,
    type ITaskDetailViewModel,
    type ITaskDetailActions
} from "./abstractions.js";
import { TaskDetailDataSource } from "./TaskDetailDataSource.js";
import { GetTaskUseCase } from "~/admin/features/getTask/abstractions.js";
import { ListLogsUseCase } from "~/admin/features/listLogs/abstractions.js";

class TaskDetailPresenterImpl implements ITaskDetailPresenter {
    private _task: Task | null = null;
    private _loading = false;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<TaskLog>,
        private readonly getTaskUseCase: GetTaskUseCase.Interface,
        private readonly listLogsUseCase: ListLogsUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ITaskDetailViewModel {
        return {
            task: this._task,
            loading: this._loading,
            logs: this.listPresenter.vm
        };
    }

    actions: ITaskDetailActions = {
        search: {
            set: (query: string) => this.listPresenter.actions.search.set(query),
            clear: () => this.listPresenter.actions.search.clear()
        },
        sort: {
            set: (field: string, direction: "ASC" | "DESC") =>
                this.listPresenter.actions.sort.set(field, direction),
            toggle: (field: string) => this.listPresenter.actions.sort.toggle(field)
        },
        filter: {
            set: (key: string, value: unknown) => this.listPresenter.actions.filter.set(key, value),
            clear: (key: string) => this.listPresenter.actions.filter.clear(key),
            clearAll: () => this.listPresenter.actions.filter.clearAll()
        },
        selection: {
            toggle: (id: string) => this.listPresenter.actions.selection.toggle(id),
            selectRangeTo: (id: string) => this.listPresenter.actions.selection.selectRangeTo(id),
            selectAll: () => this.listPresenter.actions.selection.selectAll(),
            deselectAll: () => this.listPresenter.actions.selection.deselectAll(),
            selectRows: (ids: string[]) => this.listPresenter.actions.selection.selectRows(ids),
            isSelected: (id: string) => this.listPresenter.actions.selection.isSelected(id)
        },
        loadMore: () => this.listPresenter.actions.loadMore(),
        refresh: () => this.listPresenter.actions.refresh()
    };

    async init(taskId: string): Promise<void> {
        this._loading = true;

        const task = await this.getTaskUseCase.execute(taskId);

        runInAction(() => {
            this._task = task;
            this._loading = false;
        });

        const dataSource = new TaskDetailDataSource(this.listLogsUseCase, taskId);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 50
        });
    }
}

export const TaskDetailPresenter = Abstraction.createImplementation({
    implementation: TaskDetailPresenterImpl,
    dependencies: [ListPresenter, GetTaskUseCase, ListLogsUseCase]
});
```

- [ ] **Step 4: Create feature and index**

File: `packages/background-tasks/src/admin/presentation/TaskDetail/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/admin";
import { TaskDetailPresenter as PresenterAbstraction } from "./abstractions.js";
import { TaskDetailPresenter } from "./TaskDetailPresenter.js";

export const TaskDetailPresenterFeature = createFeature({
    name: "BackgroundTasks/TaskDetailPresenter",
    register(container) {
        container.register(TaskDetailPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
```

File: `packages/background-tasks/src/admin/presentation/TaskDetail/index.ts`

```typescript
export { TaskDetailPresenter } from "./abstractions.js";
export { TaskDetailPresenterFeature } from "./feature.js";
```

- [ ] **Step 5: Create TaskDetailDrawer component**

File: `packages/background-tasks/src/admin/presentation/TaskDetail/components/TaskDetailDrawer.tsx`

```typescript
import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import {
    Button,
    Drawer,
    Grid,
    Heading,
    Separator,
    Tag,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { CodeEditor } from "@webiny/admin-ui";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as StopCircleIcon } from "@webiny/icons/stop_circle.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as ExpandLessIcon } from "@webiny/icons/expand_less.svg";
import { TaskDetailPresenterFeature } from "../feature.js";
import { GetTaskFeature } from "~/admin/features/getTask/feature.js";
import { ListLogsFeature } from "~/admin/features/listLogs/feature.js";
import type { Task, TaskLog, TaskLogItem } from "~/admin/shared/types.js";

const STATUS_TAG_VARIANT: Record<string, "neutral-light" | "accent" | "success" | "destructive" | "warning"> = {
    pending: "neutral-light",
    running: "accent",
    success: "success",
    completed: "success",
    failed: "destructive",
    aborted: "warning"
};

const formatJson = (value: unknown): string => {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "string") {
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }
    return JSON.stringify(value, null, 2);
};

interface LogItemViewProps {
    item: TaskLogItem;
}

const LogItemView = ({ item }: LogItemViewProps) => {
    const [expanded, setExpanded] = useState(false);
    const hasData = item.data !== null && item.data !== undefined;
    const hasError = item.error !== null && item.error !== undefined;
    const expandable = hasData || hasError;

    return (
        <div className="border-b-sm border-neutral-muted py-xs px-sm">
            <div className="flex items-start gap-sm">
                <div className="flex-shrink-0 pt-[2px]">
                    <Tag
                        variant={item.type === "error" ? "destructive" : "neutral-light"}
                        content={item.type}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <Text size="sm">{item.message}</Text>
                </div>
                <div className="flex items-center gap-xs flex-shrink-0">
                    <Text size="sm" className="text-neutral-strong">
                        <TimeAgo datetime={item.createdOn} />
                    </Text>
                    {expandable && (
                        <Button
                            variant="tertiary"
                            size="sm"
                            icon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            onClick={() => setExpanded(!expanded)}
                        />
                    )}
                </div>
            </div>
            {expanded && hasData && (
                <div className="mt-xs">
                    <Text size="sm" className="text-neutral-strong mb-xs">
                        Data
                    </Text>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {formatJson(item.data)}
                    </pre>
                </div>
            )}
            {expanded && hasError && (
                <div className="mt-xs">
                    <Text size="sm" className="text-neutral-strong mb-xs">
                        Error
                    </Text>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px] text-destructive">
                        {formatJson(item.error)}
                    </pre>
                </div>
            )}
        </div>
    );
};

interface TaskDetailDrawerProps {
    task: Task;
    open: boolean;
    onClose: () => void;
    onAbort: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const TaskDetailDrawerInner = observer(function TaskDetailDrawerInner({
    task,
    open,
    onClose,
    onAbort,
    onDelete
}: TaskDetailDrawerProps) {
    const { presenter } = useFeature(TaskDetailPresenterFeature);

    useEffect(() => {
        if (open) {
            void presenter.init(task.id);
        }
    }, [presenter, task.id, open]);

    const { vm } = presenter;

    const { showConfirmation: showAbortConfirmation } = useConfirmationDialog({
        title: "Abort Task",
        message: "Are you sure you want to abort this running task?"
    });

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: "Delete Task",
        message: "Are you sure you want to delete this task?"
    });

    const displayTask = vm.task ?? task;
    const isRunning = displayTask.taskStatus === "running";
    const isTerminal =
        displayTask.taskStatus === "completed" ||
        displayTask.taskStatus === "failed" ||
        displayTask.taskStatus === "aborted";

    const inputJson = formatJson(displayTask.input);
    const outputJson = formatJson(displayTask.output);

    return (
        <Drawer
            open={open}
            onOpenChange={isOpen => !isOpen && onClose()}
            title={
                <div className="flex items-center gap-sm">
                    <span>{displayTask.name || displayTask.definitionId}</span>
                    <Tag
                        variant={STATUS_TAG_VARIANT[displayTask.taskStatus] ?? "neutral-light"}
                        content={displayTask.taskStatus}
                    />
                </div>
            }
            modal={true}
            width="900px"
            bodyPadding={false}
            actions={
                <div className="flex gap-sm">
                    {isRunning && (
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<StopCircleIcon />}
                            onClick={() => showAbortConfirmation(() => onAbort(displayTask.id))}
                        >
                            Abort
                        </Button>
                    )}
                    {isTerminal && (
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<DeleteIcon />}
                            onClick={() => showDeleteConfirmation(() => onDelete(displayTask.id))}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col gap-md p-md overflow-auto">
                <div>
                    <Heading level={6} className="mb-sm">
                        General Info
                    </Heading>
                    <Grid gap="comfortable">
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Definition
                            </Text>
                            <Text size="sm">{displayTask.definitionId}</Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Created By
                            </Text>
                            <Text size="sm">
                                {(displayTask as Record<string, any>).createdBy?.displayName ?? "—"}
                            </Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Created On
                            </Text>
                            <Text size="sm">
                                {displayTask.createdOn ? (
                                    <TimeAgo datetime={displayTask.createdOn} />
                                ) : (
                                    "—"
                                )}
                            </Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Started On
                            </Text>
                            <Text size="sm">
                                {displayTask.startedOn ? (
                                    <TimeAgo datetime={displayTask.startedOn} />
                                ) : (
                                    "—"
                                )}
                            </Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Finished On
                            </Text>
                            <Text size="sm">
                                {displayTask.finishedOn ? (
                                    <TimeAgo datetime={displayTask.finishedOn} />
                                ) : (
                                    "—"
                                )}
                            </Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Iterations
                            </Text>
                            <Text size="sm">{displayTask.iterations ?? 0}</Text>
                        </Grid.Column>
                    </Grid>
                </div>

                {inputJson && (
                    <>
                        <Separator />
                        <div>
                            <Heading level={6} className="mb-sm">
                                Input
                            </Heading>
                            <CodeEditor
                                value={inputJson}
                                language="json"
                                disabled={true}
                            />
                        </div>
                    </>
                )}

                {outputJson && (
                    <>
                        <Separator />
                        <div>
                            <Heading level={6} className="mb-sm">
                                Output
                            </Heading>
                            <CodeEditor
                                value={outputJson}
                                language="json"
                                disabled={true}
                            />
                        </div>
                    </>
                )}

                <Separator />
                <div>
                    <Heading level={6} className="mb-sm">
                        Logs ({vm.logs.pagination.totalCount})
                    </Heading>
                    {vm.logs.rows.length === 0 && !vm.logs.pagination.loading ? (
                        <Text size="sm" className="text-neutral-strong">
                            No logs available.
                        </Text>
                    ) : (
                        <div className="border-sm border-neutral-muted rounded-sm">
                            {vm.logs.rows.map((log: TaskLog) =>
                                log.items.map((item, idx) => (
                                    <LogItemView key={`${log.id}-${idx}`} item={item} />
                                ))
                            )}
                        </div>
                    )}
                    {vm.logs.pagination.hasMore && (
                        <div className="mt-sm">
                            <Button
                                variant="tertiary"
                                size="sm"
                                onClick={() => presenter.actions.loadMore()}
                                disabled={vm.logs.pagination.loading}
                            >
                                {vm.logs.pagination.loading ? "Loading..." : "Load more logs"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    );
});

export const TaskDetailDrawer = (props: TaskDetailDrawerProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        GetTaskFeature.register(child);
        ListLogsFeature.register(child);
        TaskDetailPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <TaskDetailDrawerInner {...props} />
        </DiContainerProvider>
    );
};
```

- [ ] **Step 6: Commit**

```bash
git add packages/background-tasks/src/admin/presentation/TaskDetail/
git commit -m "feat(background-tasks): add TaskDetail presenter and drawer"
```

---

### Task 12: Main component, routes, and admin entry

**Files:**
- Create: `packages/background-tasks/src/admin/BackgroundTasks.tsx`
- Create: `packages/background-tasks/src/admin/BackgroundTaskRoutes.tsx`
- Create: `packages/background-tasks/src/admin/index.ts`

- [ ] **Step 1: Create BackgroundTasks main component**

File: `packages/background-tasks/src/admin/BackgroundTasks.tsx`

```typescript
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { RegisterFeature } from "@webiny/app-admin";
import { ReactComponent as TaskIcon } from "@webiny/icons/task.svg";
import { ListTasksFeature } from "./features/listTasks/index.js";
import { GetTaskFeature } from "./features/getTask/index.js";
import { DeleteTaskFeature } from "./features/deleteTask/index.js";
import { AbortTaskFeature } from "./features/abortTask/index.js";
import { ListLogsFeature } from "./features/listLogs/index.js";
import { ListDefinitionsFeature } from "./features/listDefinitions/index.js";
import { TaskPermissionsFeature } from "./features/permissions/index.js";
import { TaskListPresenterFeature } from "./presentation/TaskList/index.js";
import { TaskDetailPresenterFeature } from "./presentation/TaskDetail/index.js";
import { BackgroundTaskRoutes } from "./BackgroundTaskRoutes.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

const { Security } = AdminConfig;

export const BackgroundTasks = () => {
    return (
        <>
            {/* Headless features. */}
            <RegisterFeature feature={ListTasksFeature} />
            <RegisterFeature feature={GetTaskFeature} />
            <RegisterFeature feature={DeleteTaskFeature} />
            <RegisterFeature feature={AbortTaskFeature} />
            <RegisterFeature feature={ListLogsFeature} />
            <RegisterFeature feature={ListDefinitionsFeature} />
            <RegisterFeature feature={TaskPermissionsFeature} />
            {/* Presentation features. */}
            <RegisterFeature feature={TaskListPresenterFeature} />
            <RegisterFeature feature={TaskDetailPresenterFeature} />
            {/* Routes + menu. */}
            <BackgroundTaskRoutes />
            {/* Security permissions UI. */}
            <AdminConfig>
                <Security.Permissions
                    name="backgroundTasks"
                    title="Background Tasks"
                    description="Manage background task permissions."
                    icon={<TaskIcon />}
                    schema={BACKGROUND_TASK_PERMISSIONS_SCHEMA}
                />
            </AdminConfig>
        </>
    );
};
```

- [ ] **Step 2: Create BackgroundTaskRoutes**

File: `packages/background-tasks/src/admin/BackgroundTaskRoutes.tsx`

```typescript
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { TaskListView } from "./presentation/TaskList/components/TaskListView.js";
import { Routes } from "./routes.js";

const { Menu, Route } = AdminConfig;

export const BackgroundTaskRoutes = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <HasPermission entity="task">
                <Route
                    route={Routes.List}
                    element={
                        <AdminLayout title="Background Tasks">
                            <TaskListView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="backgroundTasks.list"
                    parent="dev-tools"
                    element={
                        <Menu.Link
                            text="Background Tasks"
                            to={getLink(Routes.List)}
                        />
                    }
                />
            </HasPermission>
        </AdminConfig>
    );
};
```

- [ ] **Step 3: Create admin index**

File: `packages/background-tasks/src/admin/index.ts`

```typescript
export { BackgroundTasks } from "./BackgroundTasks.js";
export { Routes } from "./routes.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/background-tasks/src/admin/
git commit -m "feat(background-tasks): add main component, routes, and admin entry"
```

---

### Task 13: Pre-commit checks and build verification

- [ ] **Step 1: Run pre-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

If any step fails, fix the issue and rerun from the top.

- [ ] **Step 2: Type-check the package**

```bash
yarn check -p @webiny/background-tasks 2>&1 | tail -30
```

Fix any type errors. Common issues to watch for:
- Missing type exports from `@webiny/sdk` (Task types may need `createdOn`, `createdBy` fields not on `TaskRun`)
- Import path `.js` suffixes
- `ListPresenter` generic type parameter mismatches

- [ ] **Step 3: Build the package**

```bash
yarn build -p @webiny/background-tasks 2>&1 | tail -30
```

Fix any build errors.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore(background-tasks): fix lint, formatting, and build"
```

---

## Notes for implementer

**SDK type gap:** The SDK `TaskRun` type does not include `createdOn`, `createdBy`, or `savedOn` — those come from the CMS layer. The GraphQL API returns them on `WebinyBackgroundTask`. The `Task` type alias in `shared/types.ts` re-exports `TaskRun` from the SDK. You may need to extend it with those additional fields, or cast where needed in the drawer. If type errors occur, create a local `Task` interface in `shared/types.ts` that includes those fields.

**GraphQL filter field names:** The `WebinyBackgroundTaskListWhereInput` is dynamically generated from the CMS model fields. Filter keys used in the UI (like `taskStatus_in`, `definitionId`) must match the actual generated filter input. Check the GraphQL schema in the running app if filters don't work.

**Permissions without `task` permission:** Users without the `task` permission should only see their own tasks. This is handled server-side (the API already filters by `createdBy` for unauthorized users). The admin UI just needs to check if the user has the permission for showing action buttons (delete, abort).
