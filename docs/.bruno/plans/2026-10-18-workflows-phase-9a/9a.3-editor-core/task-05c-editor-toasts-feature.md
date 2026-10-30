### Task 5c: Editor toasts and `WorkflowEditorServicesFeature` (the contract's "Task 5b additions")

R211, R237, D125; Q43; Review Focus 10. The editor toasts and the feature that registers the app-neutral editor services, in `packages/app-workflows/src/editor`, wired into `WorkflowsAdminApp` behind the feature flag.

Behaviour:

- **Toasts (D125):** `WorkflowEditorToasts` has `success(title)`, `error(title)` and `info(title)` over the admin `Notifications`, always bottom right, 8 seconds, dismissible, title only (no description, no link). `success` and `error` use the admin success and error variants; `info` uses `notify`, the default variant (the admin `Notifications` has no `info`; `warning` would be wrong for `Retrying…`). Presenters (Tasks 9, 10, 14) pass the exact copy. The 8a `ReviewToasts` stays review-only. The position and duration come from `REVIEW_TOAST_POSITION` and `REVIEW_TOAST_DURATION` (`~/review/toasts/constants.js`: `"bottom-right"`, `8000`), the one D125 definition.
- **Feature:** `WorkflowEditorServicesFeature` (name `Workflows/WorkflowEditorServices`) registers the config gateway, the config use cases and the toasts as singletons and resolves `{ configUseCases, toasts }`. The per-app editor use cases are registered by each app package (Task 7).
- **Registration (R211):** `WorkflowsAdminApp` registers the feature inside the flag gate; `app.test.tsx` asserts it with the flag on and off.

**Files:**
- Create: `packages/app-workflows/src/editor/toasts/WorkflowEditorToasts.ts` (token), `.../toasts/WorkflowEditorToastsImpl.ts`, `.../toasts/WorkflowEditorToastsImpl.test.ts`
- Create: `packages/app-workflows/src/editor/feature.ts`, `packages/app-workflows/src/editor/feature.test.ts`
- Create: `packages/app-workflows/src/editor/testing/fakeWorkflowEditorToasts.ts`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`

**Interfaces:**
- Consumes (Task 5b): `WorkflowConfigGateway` (token) and `WorkflowConfigGatewayImpl.ts`, `WorkflowConfigUseCases` (token) and `WorkflowConfigUseCasesImpl.ts`. Existing (verified): `Notifications` (`@webiny/app-admin/features/notifications/abstractions.js`: `notify`, `success`, `warning`, `error`, each taking `INotificationInput { title, description?, link?, duration?, position?, dismissible? }`), `REVIEW_TOAST_POSITION`, `REVIEW_TOAST_DURATION`, `createFeature` (`@webiny/feature/admin`), `MainGraphQLClient`.
- Produces: `IWorkflowEditorToasts { success(title: string): void; error(title: string): void; info(title: string): void }`, `WorkflowEditorToasts` (token), `WorkflowEditorServicesFeature` (resolves `{ configUseCases, toasts }`), `createFakeEditorToasts` / `FakeWorkflowEditorToasts`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/toasts/WorkflowEditorToastsImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WorkflowEditorToasts as ToastsAbstraction } from "./WorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "./WorkflowEditorToastsImpl.js";

type FakeNotifications = { [K in keyof Notifications.Interface]: Mock };

const createFakeNotifications = (): FakeNotifications => {
    return {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    };
};

describe("WorkflowEditorToasts", () => {
    let notifications: FakeNotifications;
    let toasts: ToastsAbstraction.Interface;

    beforeEach(() => {
        notifications = createFakeNotifications();
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(WorkflowEditorToasts).inSingletonScope();
        toasts = container.resolve(ToastsAbstraction);
    });

    it("shows a success toast with the D125 options and only a title", () => {
        toasts.success("Workflow saved");

        expect(notifications.success).toHaveBeenCalledTimes(1);
        expect(notifications.success).toHaveBeenCalledWith({
            title: "Workflow saved",
            position: "bottom-right",
            duration: 8000,
            dismissible: true
        });
        expect(notifications.error).not.toHaveBeenCalled();
        expect(notifications.notify).not.toHaveBeenCalled();
    });

    it("shows an error toast with the D125 options", () => {
        toasts.error("Could not save. Check the highlighted step.");

        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(notifications.error).toHaveBeenCalledWith({
            title: "Could not save. Check the highlighted step.",
            position: "bottom-right",
            duration: 8000,
            dismissible: true
        });
        expect(notifications.success).not.toHaveBeenCalled();
        expect(notifications.notify).not.toHaveBeenCalled();
    });

    it("shows an info toast through the default variant with the D125 options", () => {
        toasts.info("Retrying…");

        expect(notifications.notify).toHaveBeenCalledTimes(1);
        expect(notifications.notify).toHaveBeenCalledWith({
            title: "Retrying…",
            position: "bottom-right",
            duration: 8000,
            dismissible: true
        });
        expect(notifications.success).not.toHaveBeenCalled();
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("adds neither a description nor a link", () => {
        toasts.success("Loaded the latest version");

        const input = notifications.success.mock.calls[0][0];
        expect(input).not.toHaveProperty("description");
        expect(input).not.toHaveProperty("link");
    });

    it("is a singleton", () => {
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(WorkflowEditorToasts).inSingletonScope();

        expect(container.resolve(ToastsAbstraction)).toBe(container.resolve(ToastsAbstraction));
    });
});
```

Create `packages/app-workflows/src/editor/feature.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WorkflowEditorServicesFeature } from "./feature.js";
import { WorkflowConfigGateway } from "./gateway/WorkflowConfigGateway.js";
import { WorkflowConfigUseCases } from "./useCases/WorkflowConfigUseCases.js";
import { WorkflowEditorToasts } from "./toasts/WorkflowEditorToasts.js";

const createContainer = (execute = vi.fn()): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute });
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    return container;
};

describe("WorkflowEditorServicesFeature", () => {
    it("registers the config gateway, the config use cases and the toasts", () => {
        const container = createContainer();
        WorkflowEditorServicesFeature.register(container);

        expect(container.resolve(WorkflowConfigGateway)).toBeDefined();
        expect(container.resolve(WorkflowConfigUseCases)).toBeDefined();
        expect(container.resolve(WorkflowEditorToasts)).toBeDefined();
    });

    it("registers them as singletons and resolves them", () => {
        const container = createContainer();
        WorkflowEditorServicesFeature.register(container);

        const first = WorkflowEditorServicesFeature.resolve(container);
        const second = WorkflowEditorServicesFeature.resolve(container);

        expect(first.configUseCases).toBe(second.configUseCases);
        expect(first.toasts).toBe(second.toasts);
        expect(first.configUseCases).toBe(container.resolve(WorkflowConfigUseCases));
        expect(container.resolve(WorkflowConfigGateway)).toBe(
            container.resolve(WorkflowConfigGateway)
        );
    });

    it("runs the config use cases over the shared gateway", async () => {
        const execute = vi.fn().mockResolvedValue({
            workflows: {
                listNotificationTransports: {
                    data: [{ id: "e-mail", title: "E-mail", description: null }],
                    error: null
                }
            }
        });
        const container = createContainer(execute);
        WorkflowEditorServicesFeature.register(container);
        const { configUseCases } = WorkflowEditorServicesFeature.resolve(container);

        const transports = await configUseCases.listNotificationTransports();

        expect(transports).toEqual([{ id: "e-mail", title: "E-mail", description: null }]);
        expect(execute).toHaveBeenCalledTimes(1);
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`. Add the import after the `EventPublisher` import line:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
```

and, after the `ReviewNotificationService` import line:

```ts
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
```

In `mount`, add one line after `container.registerInstance(EventPublisher, { publish: vi.fn().mockResolvedValue(undefined) });`:

```ts
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
```

Append at the end of the file:

```ts
describe("WorkflowsAdminApp workflow editor services", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the editor services when advancedPublishingWorkflow is on", () => {
        const container = mount(true);

        expect(container.resolve(WorkflowConfigUseCases)).toBeDefined();
        expect(container.resolve(WorkflowEditorToasts)).toBeDefined();
    });

    it("registers them as singletons", () => {
        const container = mount(true);

        expect(container.resolve(WorkflowConfigUseCases)).toBe(
            container.resolve(WorkflowConfigUseCases)
        );
        expect(container.resolve(WorkflowEditorToasts)).toBe(
            container.resolve(WorkflowEditorToasts)
        );
    });

    it("registers no editor service when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowConfigUseCases)).toThrow();
        expect(() => container.resolve(WorkflowEditorToasts)).toThrow();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/toasts/WorkflowEditorToastsImpl.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: `WorkflowEditorToastsImpl.test.ts` and `feature.test.ts` fail with `Failed to resolve import` for `WorkflowEditorToasts.js` and `feature.js`; `app.test.tsx` fails to resolve `~/editor/toasts/WorkflowEditorToasts.js`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/toasts/WorkflowEditorToasts.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";

/*
 * The editor's toasts (D125): a title only, bottom right, 8 seconds, with a close button. The
 * presenters pass the exact copy: `Workflow saved`, `Retrying…` and so on.
 */
export interface IWorkflowEditorToasts {
    success(title: string): void;
    error(title: string): void;
    // The default (neutral) variant, for example `Retrying…`.
    info(title: string): void;
}

export const WorkflowEditorToasts = createAbstraction<IWorkflowEditorToasts>(
    "Workflows/WorkflowEditorToasts"
);

export namespace WorkflowEditorToasts {
    export type Interface = IWorkflowEditorToasts;
}
```

Create `packages/app-workflows/src/editor/toasts/WorkflowEditorToastsImpl.ts`:

```ts
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";
import { WorkflowEditorToasts as Abstraction } from "./WorkflowEditorToasts.js";

const createInput = (title: string): INotificationInput => {
    return {
        title,
        position: REVIEW_TOAST_POSITION,
        duration: REVIEW_TOAST_DURATION,
        dismissible: true
    };
};

class WorkflowEditorToastsImpl implements Abstraction.Interface {
    constructor(private notifications: Notifications.Interface) {}

    success(title: string): void {
        const input = createInput(title);
        this.notifications.success(input);
    }

    error(title: string): void {
        const input = createInput(title);
        this.notifications.error(input);
    }

    info(title: string): void {
        const input = createInput(title);
        this.notifications.notify(input);
    }
}

export const WorkflowEditorToasts = Abstraction.createImplementation({
    implementation: WorkflowEditorToastsImpl,
    dependencies: [Notifications]
});
```

Create `packages/app-workflows/src/editor/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowConfigGateway } from "./gateway/WorkflowConfigGatewayImpl.js";
import { WorkflowConfigUseCases as ConfigUseCasesAbstraction } from "./useCases/WorkflowConfigUseCases.js";
import { WorkflowConfigUseCases } from "./useCases/WorkflowConfigUseCasesImpl.js";
import { WorkflowEditorToasts as ToastsAbstraction } from "./toasts/WorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "./toasts/WorkflowEditorToastsImpl.js";

/*
 * The app-neutral editor services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): the shared config gateway and use cases and the editor toasts. All are singletons.
 * The per-app editor use cases are registered by each app package (Task 7).
 */
export const WorkflowEditorServicesFeature = createFeature({
    name: "Workflows/WorkflowEditorServices",
    register(container) {
        container.register(WorkflowConfigGateway).inSingletonScope();
        container.register(WorkflowConfigUseCases).inSingletonScope();
        container.register(WorkflowEditorToasts).inSingletonScope();
    },
    resolve(container) {
        return {
            configUseCases: container.resolve(ConfigUseCasesAbstraction),
            toasts: container.resolve(ToastsAbstraction)
        };
    }
});
```

Create `packages/app-workflows/src/editor/testing/fakeWorkflowEditorToasts.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IWorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";

export interface FakeWorkflowEditorToasts extends IWorkflowEditorToasts {
    success: Mock<IWorkflowEditorToasts["success"]>;
    error: Mock<IWorkflowEditorToasts["error"]>;
    info: Mock<IWorkflowEditorToasts["info"]>;
}

export const createFakeEditorToasts = (): FakeWorkflowEditorToasts => {
    return { success: vi.fn(), error: vi.fn(), info: vi.fn() };
};
```

Modify `packages/app-workflows/src/app.tsx`. Add the import after the `ReviewServicesFeature` import:

```ts
import { WorkflowEditorServicesFeature } from "~/editor/feature.js";
```

and register the feature after `<RegisterFeature feature={ReviewServicesFeature} />`:

```tsx
            <RegisterFeature feature={ReviewServicesFeature} />
            <RegisterFeature feature={WorkflowEditorServicesFeature} />
            <RegisterFeature feature={WorkflowsEditorPresenterFeature} />
```

(`WorkflowsEditorPresenterFeature` is the old editor's registration; Task 22 removes it. Do not touch it here.)

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/toasts/WorkflowEditorToastsImpl.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.test.ts 2>&1 | tail -30
```
```bash
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. `app.cleanup.test.tsx` still passes because the old editor is still registered.

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
git commit -m "feat(app-workflows): add the workflow editor toasts and services feature" -m "WorkflowEditorToasts shows success, error and info toasts with the D125 options over the admin notifications. WorkflowEditorServicesFeature registers the config gateway, the config use cases and the toasts as singletons, and WorkflowsAdminApp registers it behind the feature flag." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`info` toast:** the admin `Notifications` has `notify`, `success`, `warning` and `error` but no `info`. `IWorkflowEditorToasts.info` calls `notify`, the default variant. The contract name is kept.
- **Old editor registration:** `WorkflowsEditorPresenterFeature` stays in `app.tsx` until Task 22.
