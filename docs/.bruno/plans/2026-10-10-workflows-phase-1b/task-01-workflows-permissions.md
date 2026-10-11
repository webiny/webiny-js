### Task 1: Shared workflows permission checker

**Files:**
- Create: `packages/api-workflows/src/domain/permissions/types.ts`
- Modify: `packages/api-workflows/src/types.ts`
- Create: `packages/api-workflows/src/features/permissions/WorkflowsPermissions/abstractions.ts`
- Create: `packages/api-workflows/src/features/permissions/WorkflowsPermissions/WorkflowsPermissions.ts`
- Create: `packages/api-workflows/src/features/permissions/WorkflowsPermissions/feature.ts`
- Create: `packages/api-workflows/src/features/permissions/WorkflowsPermissions/index.ts`
- Modify: `packages/api-workflows/src/features/notifications/ListNotificationTypes/ListNotificationTypesUseCase.ts`
- Modify: `packages/api-workflows/src/features/notifications/ListNotificationTypes/abstractions.ts`
- Modify: `packages/api-workflows/src/features/notifications/ListNotificationTypes/index.ts`
- Delete: `packages/api-workflows/src/domain/notifications/errors.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/permissions/WorkflowsPermissions.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ListNotificationTypes.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Modify: `packages/api-workflows/__tests__/types.test.ts`

**Interfaces:**
- Consumes: `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`: `getPermission(name)`, `getPermissions(name)`), `WORKFLOWS_PERMISSION` (`~/constants.js`), `SecurityPermission` (`@webiny/api-core/types/security.js`), `createContextHandler` (`~tests/__helpers/handler.js`), `MailerService` (`@webiny/api-mailer`), `NotificationTransport` (`~/features/notifications/NotificationTransport/index.js`).
- Produces:
  - `type WorkflowsPermissionAction = "editor" | "reassign"`.
  - `interface WorkflowsPermissionSet { fullAccess: boolean; editor: boolean; reassign: boolean }` (full access sets `editor` and `reassign` too).
  - `interface IWorkflowsSecurityPermission extends SecurityPermission { editor?: boolean; reassign?: boolean }` (was `editor: boolean`).
  - `WorkflowsPermissions.Interface`:
    ```ts
    isFullAccess(): Promise<boolean>;
    canEdit(): Promise<boolean>;
    canReassign(): Promise<boolean>;
    getPermissionSet(): Promise<WorkflowsPermissionSet>;
    ```
  - `WorkflowsPermissionsFeature` (registered by `WorkflowsFeature`, transient scope).
  - `ListNotificationTypesUseCase` without a permission check (R40, D133): it reads no identity; the shared transports operation (phase 3/7) checks `editor`. `NotificationAuthorizedError` (`Workflows/Notification/NotAuthorized`) is deleted, it has no other user.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/permissions/WorkflowsPermissions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";

const resolveChecker = async (permissions: SecurityPermission[]) => {
    const { context } = await createContextHandler({ permissions });
    return context.container.resolve(WorkflowsPermissions);
};

const FULL: WorkflowsPermissionSet = { fullAccess: true, editor: true, reassign: true };
const NONE: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: false };

describe("WorkflowsPermissions", () => {
    it("treats * as full access (D54)", async () => {
        const checker = await resolveChecker([{ name: "*" }]);

        expect(await checker.isFullAccess()).toBe(true);
        expect(await checker.canEdit()).toBe(true);
        expect(await checker.canReassign()).toBe(true);
        expect(await checker.getPermissionSet()).toEqual(FULL);
    });

    it("treats workflows.* as full access (D54)", async () => {
        const checker = await resolveChecker([{ name: "workflows.*" }]);

        expect(await checker.isFullAccess()).toBe(true);
        expect(await checker.canEdit()).toBe(true);
        expect(await checker.canReassign()).toBe(true);
        expect(await checker.getPermissionSet()).toEqual(FULL);
    });

    it("grants only editor for an editor permission", async () => {
        const checker = await resolveChecker([{ name: "workflows", editor: true }]);

        expect(await checker.getPermissionSet()).toEqual({
            fullAccess: false,
            editor: true,
            reassign: false
        });
    });

    it("grants only reassign for a reassign permission", async () => {
        const checker = await resolveChecker([{ name: "workflows", reassign: true }]);

        expect(await checker.getPermissionSet()).toEqual({
            fullAccess: false,
            editor: false,
            reassign: true
        });
    });

    it("merges actions from several workflows permissions (one per role)", async () => {
        const checker = await resolveChecker([
            { name: "workflows", editor: true, reassign: false },
            { name: "workflows", reassign: true }
        ]);

        expect(await checker.getPermissionSet()).toEqual({
            fullAccess: false,
            editor: true,
            reassign: true
        });
    });

    it("does not grant an action whose flag is false", async () => {
        const checker = await resolveChecker([
            { name: "workflows", editor: false, reassign: false }
        ]);

        expect(await checker.getPermissionSet()).toEqual(NONE);
    });

    it("grants nothing without a workflows permission", async () => {
        const checker = await resolveChecker([{ name: "cms.*" }]);

        expect(await checker.isFullAccess()).toBe(false);
        expect(await checker.canEdit()).toBe(false);
        expect(await checker.canReassign()).toBe(false);
        expect(await checker.getPermissionSet()).toEqual(NONE);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ListNotificationTypes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ListNotificationTypesUseCase } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";

const createNotificationsContext = async (permissions: SecurityPermission[]) => {
    // `NotificationTransport` depends on the mailer, which the test context does not provide.
    const { context } = await createContextHandler({
        permissions,
        setup: container => {
            container.registerInstance(MailerService, {} as MailerService.Interface);
        }
    });
    return context.container;
};

describe("ListNotificationTypesUseCase (internal, D133)", () => {
    it("lists the registered transports without a workflows permission", async () => {
        const container = await createNotificationsContext([]);
        const transports = container.resolveAll(NotificationTransport);

        const result = await container.resolve(ListNotificationTypesUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(
            transports.map(transport => {
                return { id: transport.id, title: transport.title };
            })
        );
    });

    it("lists the registered transports for a user with reassign only", async () => {
        const container = await createNotificationsContext([
            { name: "workflows", reassign: true }
        ]);

        const result = await container.resolve(ListNotificationTypesUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toHaveLength(1);
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/permissions packages/api-workflows/__tests__/notifications 2>&1 | tail -50`
Expected: FAIL. `WorkflowsPermissions.test.ts` cannot resolve `~/features/permissions/WorkflowsPermissions/index.js`; both `ListNotificationTypes.test.ts` tests fail (`isOk()` is `false`, `Workflows/Notification/NotAuthorized`: the use case still checks `*` or `editor` itself).

- [ ] **Step 3: Add the permission types**

Create `packages/api-workflows/src/domain/permissions/types.ts`:

```ts
/** Custom boolean actions of the `workflows` permission (spec 8, D54). */
export type WorkflowsPermissionAction = "editor" | "reassign";

/**
 * What the current identity may do in workflows (spec 8, D54). Full access (`*`, `workflows.*`)
 * sets `editor` and `reassign` too, so callers only ever read the action they need.
 */
export interface WorkflowsPermissionSet {
    fullAccess: boolean;
    editor: boolean;
    reassign: boolean;
}
```

In `packages/api-workflows/src/types.ts`, replace

```ts
export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor: boolean;
}
```

with

```ts
/**
 * The `workflows` permission (spec 8, D54): `{ name: "workflows", editor?: true, reassign?: true }`;
 * full access is `workflows.*`. A missing flag means the action is not granted.
 */
export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor?: boolean;
    reassign?: boolean;
}
```

In `packages/api-workflows/__tests__/types.test.ts`, replace

```ts
        expectTypeOf<IWorkflowsSecurityPermission["editor"]>().toEqualTypeOf<boolean>();
```

with

```ts
        expectTypeOf<IWorkflowsSecurityPermission["editor"]>().toEqualTypeOf<
            boolean | undefined
        >();
        expectTypeOf<IWorkflowsSecurityPermission["reassign"]>().toEqualTypeOf<
            boolean | undefined
        >();
```

- [ ] **Step 4: Add the checker**

Create `packages/api-workflows/src/features/permissions/WorkflowsPermissions/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";

export interface IWorkflowsPermissions {
    /** `*` or `workflows.*` (D54). */
    isFullAccess(): Promise<boolean>;
    /** `editor`, or full access: configure workflows and tenant settings (spec 8). */
    canEdit(): Promise<boolean>;
    /** `reassign`, or full access: reassign, restart, cancel reviews of others (spec 8, D34). */
    canReassign(): Promise<boolean>;
    /** All three answers at once, for viewer flags (spec 5.3). */
    getPermissionSet(): Promise<WorkflowsPermissionSet>;
}

/**
 * The one shared checker of the `workflows` permission (spec 8, D54). A building block for the
 * app wrappers (D132): the api-workflows use cases never call it, they are an internal engine.
 */
export const WorkflowsPermissions = createAbstraction<IWorkflowsPermissions>(
    "WorkflowsPermissions"
);

export namespace WorkflowsPermissions {
    export type Interface = IWorkflowsPermissions;
}
```

Create `packages/api-workflows/src/features/permissions/WorkflowsPermissions/WorkflowsPermissions.ts`:

```ts
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type { IWorkflowsSecurityPermission } from "~/types.js";
import type {
    WorkflowsPermissionAction,
    WorkflowsPermissionSet
} from "~/domain/permissions/types.js";
import { WorkflowsPermissions as Abstraction } from "./abstractions.js";

const FULL_ACCESS_PERMISSION = `${WORKFLOWS_PERMISSION}.*`;

/**
 * Reads the identity's `workflows` permissions on every call: `IdentityContext` already caches
 * the loaded permissions per identity, and `withIdentity` can switch the identity mid-request, so
 * a second cache here could answer for the wrong identity.
 */
class WorkflowsPermissionsImpl implements Abstraction.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public async isFullAccess(): Promise<boolean> {
        // `getPermission` matches patterns, so `*` matches too; with authorization disabled it
        // returns `*`.
        const permission = await this.identityContext.getPermission(FULL_ACCESS_PERMISSION);
        return permission !== null;
    }

    public async canEdit(): Promise<boolean> {
        return this.hasAction("editor");
    }

    public async canReassign(): Promise<boolean> {
        return this.hasAction("reassign");
    }

    public async getPermissionSet(): Promise<WorkflowsPermissionSet> {
        const [fullAccess, editor, reassign] = await Promise.all([
            this.isFullAccess(),
            this.canEdit(),
            this.canReassign()
        ]);
        return { fullAccess, editor, reassign };
    }

    /** Granted when full access, or when any `workflows` permission (one per role) sets the flag. */
    private async hasAction(action: WorkflowsPermissionAction): Promise<boolean> {
        if (await this.isFullAccess()) {
            return true;
        }
        const permissions =
            await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(
                WORKFLOWS_PERMISSION
            );
        return permissions.some(permission => permission[action] === true);
    }
}

export const WorkflowsPermissions = Abstraction.createImplementation({
    implementation: WorkflowsPermissionsImpl,
    dependencies: [IdentityContext]
});
```

Create `packages/api-workflows/src/features/permissions/WorkflowsPermissions/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WorkflowsPermissions } from "./WorkflowsPermissions.js";

export const WorkflowsPermissionsFeature = createFeature({
    name: "Workflows/WorkflowsPermissions",
    register(container) {
        container.register(WorkflowsPermissions);
    }
});
```

Create `packages/api-workflows/src/features/permissions/WorkflowsPermissions/index.ts`:

```ts
export { WorkflowsPermissions } from "./abstractions.js";
```

- [ ] **Step 5: Register the checker**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the import

```ts
import { WorkflowsPermissionsFeature } from "~/features/permissions/WorkflowsPermissions/feature.js";
```

and append after the `// Settings` block (after `SaveWorkflowSettingsFeature.register(container);`):

```ts

        // Building blocks for the app wrappers (D132)
        WorkflowsPermissionsFeature.register(container);
```

In `packages/api-workflows/__tests__/registration.test.ts`, add the import

```ts
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
```

and add after `expect(container.resolveAll(NotificationTransport)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(WorkflowsPermissions)).toHaveLength(1);
```

- [ ] **Step 6: Remove the engine's own permission check**

The last copied check sits in an api-workflows use case. Under D132/D133 the engine checks no permissions: the shared transports operation (phase 3/7) checks `editor` with `WorkflowsPermissions` (R40).

Replace `packages/api-workflows/src/features/notifications/ListNotificationTypes/ListNotificationTypesUseCase.ts` with:

```ts
import {
    ListNotificationTypesRepository,
    ListNotificationTypesUseCase as UseCase
} from "./abstractions.js";

/**
 * Lists the registered notification transports. Internal (D132): reads no identity and checks no
 * permission; the shared transports operation checks `editor` (D133, R40).
 */
class ListNotificationTypesUseCaseImpl implements UseCase.Interface {
    public constructor(private repository: ListNotificationTypesRepository.Interface) {}

    public async execute(): UseCase.Return {
        return this.repository.execute();
    }
}

export const ListNotificationTypesUseCase = UseCase.createImplementation({
    implementation: ListNotificationTypesUseCaseImpl,
    dependencies: [ListNotificationTypesRepository]
});
```

Replace `packages/api-workflows/src/features/notifications/ListNotificationTypes/abstractions.ts` with:

```ts
import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotificationType } from "~/domain/notifications/abstractions.js";

/**
 * ListNotificationTypes use case interface. Internal (D132): no permission check, so no error of
 * its own; the shared transports operation checks `editor` (D133).
 */
export interface IListNotificationTypesUseCase {
    execute(): Promise<Result<INotificationType[]>>;
}

export const ListNotificationTypesUseCase = createAbstraction<IListNotificationTypesUseCase>(
    "ListNotificationTypesUseCase"
);

export namespace ListNotificationTypesUseCase {
    export type Interface = IListNotificationTypesUseCase;
    export type Return = Promise<Result<INotificationType[]>>;
}

/**
 * ListNotificationTypes repository interface
 */
export interface IListNotificationTypesRepository {
    execute(): Promise<Result<INotificationType[]>>;
}

export const ListNotificationTypesRepository = createAbstraction<IListNotificationTypesRepository>(
    "ListNotificationTypesRepository"
);

export namespace ListNotificationTypesRepository {
    export type Interface = IListNotificationTypesRepository;
    export type Return = Promise<Result<INotificationType[]>>;
}
```

Replace `packages/api-workflows/src/features/notifications/ListNotificationTypes/index.ts` with:

```ts
export { ListNotificationTypesFeature } from "./feature.js";
export { ListNotificationTypesRepository, ListNotificationTypesUseCase } from "./abstractions.js";
export type {
    IListNotificationTypesUseCase,
    IListNotificationTypesRepository
} from "./abstractions.js";
```

Delete the now unused error (its only user was the removed check):

Run: `git rm packages/api-workflows/src/domain/notifications/errors.ts`
Run: `grep -rn "NotificationAuthorizedError\|IListNotificationTypesUseCaseErrors\|Notification/NotAuthorized" packages/*/src packages/*/__tests__`
Expected: no output.

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/permissions packages/api-workflows/__tests__/notifications 2>&1 | tail -50`
Expected: PASS (7 + 2 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (incl. `registration.test.ts` and `types.test.ts`).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: not runnable locally (no OpenSearch, A9); record "not run" in the task report and leave it to CI.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add the shared workflows permission checker

ListNotificationTypesUseCase drops its own editor check (D133): the engine
checks no permissions.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
