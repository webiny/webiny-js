### Task 1: Shared workflows permission checker

**Files:**
- Create: `packages/api-workflows/src/domain/permissions/types.ts`
- Modify: `packages/api-workflows/src/types.ts`
- Create: `packages/api-workflows/src/features/permissions/WorkflowsPermissions/abstractions.ts`
- Create: `packages/api-workflows/src/features/permissions/WorkflowsPermissions/WorkflowsPermissions.ts`
- Create: `packages/api-workflows/src/features/permissions/WorkflowsPermissions/feature.ts`
- Create: `packages/api-workflows/src/features/permissions/WorkflowsPermissions/index.ts`
- Modify: `packages/api-workflows/src/features/notifications/ListNotificationTypes/ListNotificationTypesUseCase.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/permissions/WorkflowsPermissions.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ListNotificationTypes.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Modify: `packages/api-workflows/__tests__/types.test.ts`

**Interfaces:**
- Consumes: `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`: `getPermission(name)`, `getPermissions(name)`), `WORKFLOWS_PERMISSION` (`~/constants.js`), `SecurityPermission` (`@webiny/api-core/types/security.js`), `createContextHandler` (`~tests/__helpers/handler.js`), `MailerService` (`@webiny/api-mailer`).
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
  - `ListNotificationTypesUseCase` checks `editor` through the checker (R30).

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

const listNotificationTypes = async (permissions: SecurityPermission[]) => {
    // `NotificationTransport` depends on the mailer, which the test context does not provide.
    const { context } = await createContextHandler({
        permissions,
        setup: container => {
            container.registerInstance(MailerService, {} as MailerService.Interface);
        }
    });
    return context.container.resolve(ListNotificationTypesUseCase).execute();
};

describe("ListNotificationTypesUseCase permissions", () => {
    it("lists notification types for workflows.* (full access, D54)", async () => {
        const result = await listNotificationTypes([{ name: "workflows.*" }]);

        expect(result.isOk()).toBe(true);
    });

    it("lists notification types for an editor", async () => {
        const result = await listNotificationTypes([{ name: "workflows", editor: true }]);

        expect(result.isOk()).toBe(true);
    });

    it("refuses a user with reassign only", async () => {
        const result = await listNotificationTypes([{ name: "workflows", reassign: true }]);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Notification/NotAuthorized");
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/permissions packages/api-workflows/__tests__/notifications 2>&1 | tail -50`
Expected: FAIL. `WorkflowsPermissions.test.ts` cannot resolve `~/features/permissions/WorkflowsPermissions/index.js`; in `ListNotificationTypes.test.ts`, "lists notification types for workflows.* (full access, D54)" fails (`isOk()` is `false`: the old copy only accepts `*` and `editor`), the other two pass.

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

- [ ] **Step 6: Replace the last copied permission check**

Replace `packages/api-workflows/src/features/notifications/ListNotificationTypes/ListNotificationTypesUseCase.ts` with:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import {
    ListNotificationTypesRepository,
    ListNotificationTypesUseCase as UseCase
} from "./abstractions.js";
import { NotificationAuthorizedError } from "~/domain/notifications/errors.js";

/** Requires `editor` (spec 8), through the shared checker (R30). Notifications move in phase 7. */
class ListNotificationTypesUseCaseImpl implements UseCase.Interface {
    public constructor(
        private permissions: WorkflowsPermissions.Interface,
        private repository: ListNotificationTypesRepository.Interface
    ) {}

    public async execute(): UseCase.Return {
        if (!(await this.permissions.canEdit())) {
            return Result.fail(new NotificationAuthorizedError("You cannot list notifications."));
        }

        const result = await this.repository.execute();
        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }
}

export const ListNotificationTypesUseCase = UseCase.createImplementation({
    implementation: ListNotificationTypesUseCaseImpl,
    dependencies: [WorkflowsPermissions, ListNotificationTypesRepository]
});
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/permissions packages/api-workflows/__tests__/notifications 2>&1 | tail -50`
Expected: PASS (7 + 3 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (incl. `registration.test.ts` and `types.test.ts`).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: not runnable locally (no OpenSearch, A9); record "not run" in the task report and leave it to CI.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add the shared workflows permission checker

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
