### Task 10: Permission set, activity signal and the change message handler

R202, R211, R237 (subclass rule), R238, R253 (the client side of `workflows.reviewChanged`), R259, R260; D60, D162; Review Focus 5 (the signal carries the review id), 8 (permission set over several roles, `workflows.*` and `*`), 10 (flag-off). Three pieces of shared client plumbing that Tasks 12-17 build on. None of them changes what the viewer sees yet.

- **Permission set (R259).** A pure function `getWorkflowsPermissionSet(identity: Identity): WorkflowsPermissionSet` in `[AW]/review/domain/getWorkflowsPermissionSet.ts`; `WorkflowsPermissionSet { fullAccess: boolean; editor: boolean; reassign: boolean }` in `[AW]/review/domain/types.ts`. `fullAccess` is `identity.getPermission("workflows.*") !== null`: `Identity.getPermission` returns the exact `workflows.*` entry or a pattern entry that matches it (`*`), as the server's `isFullAccess` does. `editor` is `fullAccess` or any entry of `identity.getPermissions("workflows")` (one entry per role that has one) with `editor === true`; `reassign` likewise with `reassign === true`. The stored shape is boolean (`api-workflows/src/types.ts`, the admin `WORKFLOWS_PERMISSIONS_SCHEMA` `fullAccess: { editor: true }`). **The 8a hook compared `editor` with `WorkflowsSecurityPermissionAccessLevel.YES` (`"yes"`), read only the first matching permission and gave a `workflows.*` identity `editor: false`: that is a bug.** `useWorkflowsPermission` is rewritten over the set and returns `{ editor, reassign }`; `IWorkflowsSecurityPermission` (`[AW]/types.ts`) becomes `extends Identity.Permission { editor?: boolean; reassign?: boolean }` and is the entry type of the function; the enum `WorkflowsSecurityPermissionAccessLevel` is removed together with its only use (the grep in Step 3 lists every reference, all inside `app-workflows`: `types.ts` and `useWorkflowsPermission.ts`). `presentation/permissions/constants.ts` held only `WORKFLOWS_PERMISSION = "workflows"`, used only by the old hook; the two permission names become unexported constants of the new function and the file is deleted. Presenters read the identity through `IdentityContext` (the QBZ-73 pattern); Tasks 14 and 16 do that, this task ships the function. Granting `reassign` in the role form stays in 9c.
- **Activity signal (R260).** `ReviewActivitySignal` becomes `{ namespace: string; source: ReviewActivitySource; reviewId: string | null; targetRevisionId: string | null }`. The four `notify` callers pass the two new fields (`null` where they have none): `TargetReviewPresenter.actionDone` (the review's id, read after the refresh and falling back to the one read before it, so a request and a cancel both carry an id; the target's revision id), `ReviewDetailsPresenter.actionDone` (both from the review it holds, read before the refresh like the namespace), `ReviewListPresenter.actionDone` (the dialog's review id, no revision id) and `ReviewNotificationService.handle` (both from the message data). Nothing subscribes by review yet: the bar and drawer filters and the own-signal rule are Tasks 13 and 14; lists and widgets keep refreshing on any signal of their namespaces.
- **Change message handler (R253, R260).** `WORKFLOWS_REVIEW_CHANGED_ACTION = "workflows.reviewChanged"` in `[AW]/review/domain/constants.ts`; `WorkflowReviewChangedKind` and `WorkflowReviewChangedData { kind; reviewId; stepId: string | null; namespace; targetId; targetRevisionId }` (the mirror of the API's R253 types) in `[AW]/review/notifications/abstractions.ts`. A plain shared class `ReviewChangeMessageHandler` (`[AW]/review/mounting/ReviewChangeMessageHandler.ts`, a `WebsocketEventHandler`, constructor `(activity: ReviewActivity.Interface, adapter: IReviewContentAdapter)`) ignores every other action, a message without `data` or a string namespace, and a namespace its app's adapter does not handle; otherwise it calls `activity.notify({ namespace, source: "remote", reviewId, targetRevisionId })` (a non-string id becomes `null`). It shows nothing: no toast, no notification, no URL (the message is silent, R253). It never throws out of the event publisher: `ReviewActivity.notify` already isolates listener failures. It is exported plain; **never call `createImplementation` on it** (R237): Task 17 (CMS) and Task 18 (WB) each subclass it once and bind the subclass to `WebsocketEventHandler`. The name avoids the existing `ReviewChangedEvent` and `ReviewChangedHandler`. Nothing is registered by this task, so there is no flag-on and flag-off mount test here; `app.test.tsx` stays green unchanged (Step 5 runs it), and Tasks 17 and 18 carry the composition-root tests of the two subclasses.

**Files:**
- Create: `packages/app-workflows/src/review/testing/createWorkflowsIdentityContext.ts`
- Create: `packages/app-workflows/src/review/domain/getWorkflowsPermissionSet.ts`
- Create: `packages/app-workflows/src/review/domain/getWorkflowsPermissionSet.test.ts`
- Create: `packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.test.ts`
- Create: `packages/app-workflows/src/review/mounting/ReviewChangeMessageHandler.ts`
- Create: `packages/app-workflows/src/review/mounting/ReviewChangeMessageHandler.test.ts`
- Modify: `packages/app-workflows/src/review/domain/types.ts`
- Modify: `packages/app-workflows/src/review/domain/constants.ts`
- Modify: `packages/app-workflows/src/types.ts`
- Modify: `packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.ts`
- Delete: `packages/app-workflows/src/presentation/permissions/constants.ts`
- Modify: `packages/app-workflows/src/review/activity/abstractions.ts`
- Modify: `packages/app-workflows/src/review/activity/ReviewActivity.test.ts`
- Modify: `packages/app-workflows/src/review/notifications/abstractions.ts`
- Modify: `packages/app-workflows/src/review/notifications/ReviewNotificationService.ts`
- Modify: `packages/app-workflows/src/review/notifications/ReviewNotificationService.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts`
- Modify (mechanical, new required fields only): `packages/app-workflows/src/review/feature.test.ts`, `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx`, `packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts`, `packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx`

**Interfaces:**
- Consumes (verified): `Identity` (`@webiny/app-admin/domain/Identity.js`; `getPermission(name, exact?)`, `getPermissions(name?)`, `Identity.createAuthenticated(data)`, `Identity.createAnonymous()`, the namespace types `Identity.Permission` and `Identity.Data`); `useSecurity` (`@webiny/app-admin`, returns `{ identity, ... }`); `WebsocketEventHandler`, `WebsocketEvent`, `IncomingGenericData` (`@webiny/app-websockets/...`); `IReviewContentAdapter` (`~/review/content/IReviewContentAdapter.js`); `ReviewActivity` (`~/review/activity/abstractions.js`); the existing `ReviewNotificationHandler` as the model.
- Produces (matches the contract):
  - `createWorkflowsIdentityContext(params: WorkflowsIdentityParams = {}): IdentityContext.Interface` and `WorkflowsIdentityParams { teams?: ITeam[]; permissions?: Identity.Permission[] }` (`~/review/testing/createWorkflowsIdentityContext.js`), consumed by Tasks 14 and 16.
  - `WorkflowsPermissionSet`, `getWorkflowsPermissionSet`; `useWorkflowsPermission(): { editor: boolean; reassign: boolean }`; `IWorkflowsSecurityPermission { editor?: boolean; reassign?: boolean }`. Consumed by Tasks 14 and 16.
  - `ReviewActivitySignal { namespace; source; reviewId; targetRevisionId }`. Consumed by Tasks 13 and 14 (filters) and every `notify` caller.
  - `WORKFLOWS_REVIEW_CHANGED_ACTION`, `WorkflowReviewChangedData`, `WorkflowReviewChangedKind`, `ReviewChangeMessageHandler`. Consumed by Tasks 17 and 18.

**Test runner note:** admin package, `yarn test <path>` only; `.ts` tests here need no JSX. `yarn check:test:types -p app-workflows` applies (the package has `__tests__`), and the build type-checks the co-located tests.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/testing/createWorkflowsIdentityContext.ts` (the one shared test identity of Tasks 10, 14 and 16; a vitest fake, so it stays apart from the pure builders, R243; it uses the real `Identity.createAuthenticated`, so `getPermission` and `getPermissions` behave as in the admin):

```ts
import { vi } from "vitest";
import { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { ITeam } from "@webiny/app-admin/domain/Identity.js";
import type { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";

export interface WorkflowsIdentityParams {
    teams?: ITeam[];
    permissions?: Identity.Permission[];
}

export const createWorkflowsIdentityContext = (
    params: WorkflowsIdentityParams = {}
): IdentityContext.Interface => {
    const identity = Identity.createAuthenticated({
        id: "user-1",
        type: "admin",
        displayName: "Maja Kos",
        roles: [],
        teams: params.teams ?? [],
        permissions: params.permissions ?? [],
        profile: { external: false },
        currentTenant: { id: "root", name: "Root" },
        defaultTenant: { id: "root", name: "Root" }
    });
    return {
        getIdentity: () => identity,
        setIdentity: vi.fn(),
        clear: vi.fn()
    };
};
```

Create `packages/app-workflows/src/review/domain/getWorkflowsPermissionSet.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Identity } from "@webiny/app-admin/domain/Identity.js";
import { getWorkflowsPermissionSet } from "./getWorkflowsPermissionSet.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";

const createIdentity = (permissions: Identity.Permission[]): Identity => {
    return createWorkflowsIdentityContext({ permissions }).getIdentity();
};

describe("getWorkflowsPermissionSet (R259)", () => {
    it("grants nothing without permissions", () => {
        expect(getWorkflowsPermissionSet(createIdentity([]))).toEqual({
            fullAccess: false,
            editor: false,
            reassign: false
        });
    });

    it("grants nothing to an anonymous identity", () => {
        expect(getWorkflowsPermissionSet(Identity.createAnonymous())).toEqual({
            fullAccess: false,
            editor: false,
            reassign: false
        });
    });

    it("ignores permissions of other apps", () => {
        const identity = createIdentity([{ name: "cms.*" }, { name: "fm.file", own: true }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: false,
            reassign: false
        });
    });

    it("reads editor from one role", () => {
        const identity = createIdentity([{ name: "workflows", editor: true }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: true,
            reassign: false
        });
    });

    it("reads reassign from one role", () => {
        const identity = createIdentity([{ name: "workflows", reassign: true }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: false,
            reassign: true
        });
    });

    it("merges several roles: one grants editor, another reassign", () => {
        const identity = createIdentity([
            { name: "workflows", editor: true },
            { name: "workflows", reassign: true }
        ]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: true,
            reassign: true
        });
    });

    it("treats an explicit false as no access", () => {
        const identity = createIdentity([{ name: "workflows", editor: false, reassign: false }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: false,
            reassign: false
        });
    });

    it("does not read the string shape the 8a hook compared against", () => {
        const identity = createIdentity([{ name: "workflows", editor: "yes" }]);

        expect(getWorkflowsPermissionSet(identity).editor).toBe(false);
    });

    it("grants everything to workflows.*", () => {
        const identity = createIdentity([{ name: "workflows.*" }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: true,
            editor: true,
            reassign: true
        });
    });

    it("grants everything to the * permission", () => {
        const identity = createIdentity([{ name: "*" }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: true,
            editor: true,
            reassign: true
        });
    });

    it("keeps full access when another role has a narrower workflows entry", () => {
        const identity = createIdentity([
            { name: "workflows", editor: false },
            { name: "workflows.*" }
        ]);

        expect(getWorkflowsPermissionSet(identity).fullAccess).toBe(true);
        expect(getWorkflowsPermissionSet(identity).reassign).toBe(true);
    });
});
```

Create `packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { useWorkflowsPermission } from "./useWorkflowsPermission.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";

const security = vi.hoisted(() => {
    return { identity: null as unknown };
});

vi.mock("@webiny/app-admin", () => {
    return { useSecurity: () => ({ identity: security.identity }) };
});

const setPermissions = (permissions: Identity.Permission[]): void => {
    security.identity = createWorkflowsIdentityContext({ permissions }).getIdentity();
};

describe("useWorkflowsPermission", () => {
    beforeEach(() => {
        setPermissions([]);
    });

    it("returns false for both without a workflows permission", () => {
        const { result } = renderHook(() => useWorkflowsPermission());

        expect(result.current).toEqual({ editor: false, reassign: false });
    });

    it("reads the boolean editor and reassign of the stored permission", () => {
        setPermissions([{ name: "workflows", editor: true }]);
        const editor = renderHook(() => useWorkflowsPermission());
        setPermissions([{ name: "workflows", reassign: true }]);
        const reassign = renderHook(() => useWorkflowsPermission());

        expect(editor.result.current).toEqual({ editor: true, reassign: false });
        expect(reassign.result.current).toEqual({ editor: false, reassign: true });
    });

    it("merges the entries of several roles", () => {
        setPermissions([
            { name: "workflows", editor: true },
            { name: "workflows", reassign: true }
        ]);

        const { result } = renderHook(() => useWorkflowsPermission());

        expect(result.current).toEqual({ editor: true, reassign: true });
    });

    it("grants both to workflows.* (the 8a hook gave editor false)", () => {
        setPermissions([{ name: "workflows.*" }]);

        const { result } = renderHook(() => useWorkflowsPermission());

        expect(result.current).toEqual({ editor: true, reassign: true });
    });

    it("grants both to the * permission", () => {
        setPermissions([{ name: "*" }]);

        const { result } = renderHook(() => useWorkflowsPermission());

        expect(result.current).toEqual({ editor: true, reassign: true });
    });
});
```

Create `packages/app-workflows/src/review/mounting/ReviewChangeMessageHandler.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/admin";
import { WebsocketEvent } from "@webiny/app-websockets/events/WebsocketEvent.js";
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "~/review/domain/constants.js";
import { WORKFLOWS_REVIEW_CHANGED_ACTION } from "~/review/domain/constants.js";
import type { WorkflowReviewChangedData } from "~/review/notifications/abstractions.js";
import { ReviewChangeMessageHandler } from "./ReviewChangeMessageHandler.js";

const data: WorkflowReviewChangedData = {
    kind: "stepStarted",
    reviewId: "review-1",
    stepId: "step-1",
    namespace: "cms.article",
    targetId: "entry-1",
    targetRevisionId: "entry-1#0002"
};

const createAdapter = (prefix: string): IReviewContentAdapter => {
    return {
        canHandle: namespace => namespace.startsWith(prefix),
        getContentUrl: vi.fn(() => "/never-used"),
        getContentTypeLabel: () => null
    };
};

const createActivity = (): ReviewActivity.Interface & { notify: ReturnType<typeof vi.fn> } => {
    return { subscribe: vi.fn(), notify: vi.fn() };
};

const setup = () => {
    const activity = createActivity();
    const adapter = createAdapter("cms.");
    const handler = new ReviewChangeMessageHandler(activity, adapter);
    return { activity, adapter, handler };
};

describe("ReviewChangeMessageHandler", () => {
    it("ignores an action that is not a review change", async () => {
        const { activity, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: "aco.folder.created", data }));
        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_NOTIFICATION_ACTION, data }));

        expect(activity.notify).not.toHaveBeenCalled();
    });

    it("ignores a malformed message without data or namespace", async () => {
        const { activity, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_REVIEW_CHANGED_ACTION }));
        await handler.handle(
            new WebsocketEvent({
                action: WORKFLOWS_REVIEW_CHANGED_ACTION,
                data: { reviewId: "review-1" }
            })
        );

        expect(activity.notify).not.toHaveBeenCalled();
    });

    it("ignores a namespace its app cannot handle (each app ignores the other's messages)", async () => {
        const { activity, handler } = setup();

        await handler.handle(
            new WebsocketEvent({
                action: WORKFLOWS_REVIEW_CHANGED_ACTION,
                data: { ...data, namespace: "wb.page" }
            })
        );

        expect(activity.notify).not.toHaveBeenCalled();
    });

    it("signals the activity bus with a remote source and the review and revision ids (R260)", async () => {
        const { activity, handler } = setup();

        await handler.handle(
            new WebsocketEvent({ action: WORKFLOWS_REVIEW_CHANGED_ACTION, data })
        );

        expect(activity.notify).toHaveBeenCalledTimes(1);
        expect(activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0002"
        });
    });

    it("shows nothing and asks the adapter for no URL (the message is silent, R253)", async () => {
        const { adapter, handler } = setup();

        await handler.handle(
            new WebsocketEvent({ action: WORKFLOWS_REVIEW_CHANGED_ACTION, data })
        );

        expect(adapter.getContentUrl).not.toHaveBeenCalled();
    });

    it("turns a missing review or revision id into null", async () => {
        const { activity, handler } = setup();

        await handler.handle(
            new WebsocketEvent({
                action: WORKFLOWS_REVIEW_CHANGED_ACTION,
                data: { namespace: "cms.article", kind: "stepStarted" }
            })
        );

        expect(activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
    });

    describe("per-app subclasses (one container, two apps)", () => {
        const AdapterA = createAbstraction<IReviewContentAdapter>("Test/ChangeAdapterA");
        const AdapterB = createAbstraction<IReviewContentAdapter>("Test/ChangeAdapterB");

        class HandlerA extends ReviewChangeMessageHandler implements WebsocketEventHandler.Interface {}
        class HandlerB extends ReviewChangeMessageHandler implements WebsocketEventHandler.Interface {}

        const BoundA = WebsocketEventHandler.createImplementation({
            implementation: HandlerA,
            dependencies: [ReviewActivity, AdapterA]
        });
        const BoundB = WebsocketEventHandler.createImplementation({
            implementation: HandlerB,
            dependencies: [ReviewActivity, AdapterB]
        });

        it("each subclass reacts to its own app's namespaces only", async () => {
            const activity = createActivity();
            const container = new Container();
            container.registerInstance(ReviewActivity, activity);
            container.registerInstance(AdapterA, createAdapter("cms."));
            container.registerInstance(AdapterB, createAdapter("wb."));
            container.register(BoundA);
            container.register(BoundB);

            const handlers = container.resolveAll(WebsocketEventHandler);
            for (const handler of handlers) {
                await handler.handle(
                    new WebsocketEvent({ action: WORKFLOWS_REVIEW_CHANGED_ACTION, data })
                );
            }
            for (const handler of handlers) {
                await handler.handle(
                    new WebsocketEvent({
                        action: WORKFLOWS_REVIEW_CHANGED_ACTION,
                        data: { ...data, namespace: "wb.page", reviewId: "review-9" }
                    })
                );
            }

            expect(handlers).toHaveLength(2);
            expect(activity.notify).toHaveBeenCalledTimes(2);
            expect(activity.notify).toHaveBeenNthCalledWith(1, {
                namespace: "cms.article",
                source: "remote",
                reviewId: "review-1",
                targetRevisionId: "entry-1#0002"
            });
            expect(activity.notify).toHaveBeenNthCalledWith(2, {
                namespace: "wb.page",
                source: "remote",
                reviewId: "review-9",
                targetRevisionId: "entry-1#0002"
            });
        });

        it("the shared class carries no abstraction metadata, so it cannot be registered as is (R237)", () => {
            const container = new Container();

            expect(() => container.register(ReviewChangeMessageHandler)).toThrow(
                "No abstraction metadata found"
            );
        });
    });
});
```

Modify `packages/app-workflows/src/review/activity/ReviewActivity.test.ts`. First make the mechanical change that adds the two new required fields to every two-field signal in the file and the other test files that notify with a literal (single-line literals only; the multi-line ones are handled by hand below). From the repository root:

```bash
perl -pi -e 's/\{ namespace: ("[^"]+"), source: ("own"|"remote") \}/{ namespace: $1, source: $2, reviewId: null, targetRevisionId: null }/g' \
  packages/app-workflows/src/review/activity/ReviewActivity.test.ts \
  packages/app-workflows/src/review/notifications/ReviewNotificationService.test.ts \
  packages/app-workflows/src/review/feature.test.ts \
  packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts \
  packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx \
  packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts \
  packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx
grep -rn 'source: "' packages/app-workflows/src --include='*.test.ts' --include='*.test.tsx' | grep -v 'reviewId: null'
```

Expected from the grep: only the three multi-line expectations remain (two in `ReviewDetailsPresenter.test.ts`, one in `TargetReviewPresenter.test.ts`); they are edited below. `yarn format:fix` in Step 6 wraps the long lines.

Then add one test to `ReviewActivity.test.ts`, after `it("delivers a signal to a listener of its namespace", ...)`:

```ts
    it("delivers the review id and the target revision id untouched (R260)", () => {
        const listener = vi.fn();
        activity.subscribe(["cms.article"], listener);

        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0002"
        });

        expect(listener).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0002"
        });
    });
```

Modify `packages/app-workflows/src/review/notifications/ReviewNotificationService.test.ts` (after the mechanical change; the `createData` default has `reviewId: "review-1"` and `targetRevisionId: "entry-1#0001"`):

```ts
// before
        expect(signals).toEqual([
            { namespace: "wb.page", source: "remote", reviewId: null, targetRevisionId: null }
        ]);

// after
        expect(signals).toEqual([
            {
                namespace: "wb.page",
                source: "remote",
                reviewId: "review-1",
                targetRevisionId: "entry-1#0001"
            }
        ]);
```

(After the perl run the literal is on one line: `expect(signals).toEqual([{ namespace: "wb.page", source: "remote", reviewId: null, targetRevisionId: null }]);`. Replace that statement with the block above and rename the test to `it("signals the activity bus with a remote source, the namespace, the review id and the revision id of the message", ...)`.)

Modify `packages/app-workflows/src/review/feature.test.ts` (after the mechanical change, the notification in the test carries `reviewId: "review-1"` and `targetRevisionId: "entry-1#0001"`):

```ts
// before
        expect(listener).toHaveBeenCalledWith({ namespace: "cms.article", source: "remote", reviewId: null, targetRevisionId: null });

// after
        expect(listener).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts`: both multi-line expectations (in `it("refreshes, signals the activity bus and tells the host after an action", ...)` and `it("signals the activity bus and the host even when the refresh after an action fails", ...)`):

```ts
// before
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own"
        });

// after
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
```

(The review is read before the refresh, so the failing refresh of the second test still signals with the ids.)

Modify `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts`, in `it("refreshes, closes the action and notifies the activity bus on actionDone", ...)`:

```ts
// before
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own"
        });

// after
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own",
            reviewId: "review-1",
            targetRevisionId: TARGET.targetRevisionId
        });
```

and add two tests after it:

```ts
    it("signals the review id of the review it holds after a cancel left none (R260)", async () => {
        await setup.presenter.init(createParams(useCases));
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.refresh();
        useCases.getTargetReview.mockResolvedValue(null);

        await setup.presenter.actionDone();

        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own",
            reviewId: "review-1",
            targetRevisionId: TARGET.targetRevisionId
        });
    });

    it("signals a null review id when the target has no review before or after the action", async () => {
        useCases.getTargetReview.mockResolvedValue(null);
        await setup.presenter.init(createParams(useCases));

        await setup.presenter.actionDone();

        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own",
            reviewId: null,
            targetRevisionId: TARGET.targetRevisionId
        });
    });
```

Modify `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts`, the one list-own expectation (after the mechanical change it reads `expect(notify).toHaveBeenCalledWith({ namespace: "cms.article", source: "own", reviewId: null, targetRevisionId: null });` in `it("opens a row dialog, closes it and turns a finished action into one own signal and one refetch", ...)`):

```ts
// after
        expect(notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: "r1",
            targetRevisionId: null
        });
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
yarn test packages/app-workflows/src/review/domain/getWorkflowsPermissionSet.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/mounting/ReviewChangeMessageHandler.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/activity/ReviewActivity.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/notifications/ReviewNotificationService.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/feature.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -50
```

Expected: the permission-set test fails with `Failed to resolve import "./getWorkflowsPermissionSet.js"`; the hook test fails for `workflows.*` and for both `reassign` cases (the old hook returns `editor: false` for `workflows.*`, no `reassign`, and compares to `"yes"`); the handler test fails with `Failed to resolve import "./ReviewChangeMessageHandler.js"` (and the missing constant); the activity, notification service, feature and the three presenter tests fail on the new `reviewId` and `targetRevisionId` fields (the expectations carry them, the code does not).

- [ ] **Step 3: Implementation**

Before editing, list every reference to the symbols this task removes (all are inside `app-workflows`; expect `types.ts` and `presentation/permissions/useWorkflowsPermission.ts` only, plus `index.tsx` and `permissions/index.tsx` re-exporting the hook):

```bash
grep -rn "WorkflowsSecurityPermissionAccessLevel\|IWorkflowsSecurityPermission\|WORKFLOWS_PERMISSION\b" packages --include='*.ts' --include='*.tsx' -l | grep -v node_modules | grep -v /dist/
```

`packages/api-workflows/src/types.ts` and `.../WorkflowsPermissions.ts` have their own `IWorkflowsSecurityPermission`; they are not touched.

Create `packages/app-workflows/src/review/domain/getWorkflowsPermissionSet.ts`:

```ts
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { IWorkflowsSecurityPermission } from "~/types.js";
import type { WorkflowsPermissionSet } from "./types.js";

const WORKFLOWS_PERMISSION_NAME = "workflows";
const WORKFLOWS_FULL_ACCESS_NAME = "workflows.*";

/*
 * What the signed-in identity may do in workflows (R259), for display gates only: the server keeps
 * every check. `getPermission("workflows.*")` finds the exact full-access entry or a pattern entry
 * that matches it (`*`), as the server's `isFullAccess` does. `getPermissions("workflows")` returns
 * one entry per role that has one, so several roles add up. The stored values are booleans. Pure.
 */
export const getWorkflowsPermissionSet = (identity: Identity): WorkflowsPermissionSet => {
    const fullAccess = identity.getPermission(WORKFLOWS_FULL_ACCESS_NAME) !== null;
    const entries = identity.getPermissions<IWorkflowsSecurityPermission>(WORKFLOWS_PERMISSION_NAME);

    const editor = fullAccess || entries.some(entry => entry.editor === true);
    const reassign = fullAccess || entries.some(entry => entry.reassign === true);

    return { fullAccess, editor, reassign };
};
```

Modify `packages/app-workflows/src/review/domain/types.ts`: append at the end of the file:

```ts

/*
 * The viewer's `workflows` permission as the client reads it (R259): `fullAccess` is `workflows.*`
 * or `*`; `editor` and `reassign` include full access.
 */
export interface WorkflowsPermissionSet {
    fullAccess: boolean;
    editor: boolean;
    reassign: boolean;
}
```

Modify `packages/app-workflows/src/types.ts`:

```ts
// before
export enum WorkflowsSecurityPermissionAccessLevel {
    NO = "no",
    YES = "yes"
}

export interface IWorkflowsSecurityPermission extends Identity.Permission {
    editor: WorkflowsSecurityPermissionAccessLevel;
}

// after
// The stored `workflows` permission (R259): booleans, one entry per role.
export interface IWorkflowsSecurityPermission extends Identity.Permission {
    editor?: boolean;
    reassign?: boolean;
}
```

(Keep the file's other content and its `Identity` import as they are.)

Replace `packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.ts` with:

```ts
import { useSecurity } from "@webiny/app-admin";
import { getWorkflowsPermissionSet } from "~/review/domain/getWorkflowsPermissionSet.js";

interface IHasAccessResponse {
    editor: boolean;
    reassign: boolean;
}

/*
 * The viewer's workflows permissions (R259). The hook only reads the identity; the rules live in
 * `getWorkflowsPermissionSet`, which also handles several roles, `workflows.*` and `*`.
 */
export const useWorkflowsPermission = (): IHasAccessResponse => {
    const { identity } = useSecurity();
    const permissions = getWorkflowsPermissionSet(identity);

    return { editor: permissions.editor, reassign: permissions.reassign };
};
```

Delete `packages/app-workflows/src/presentation/permissions/constants.ts` (`git rm`); the new function owns its two names.

Modify `packages/app-workflows/src/review/activity/abstractions.ts`:

```ts
// before
export interface ReviewActivitySignal {
    namespace: string;
    source: ReviewActivitySource;
}

// after
export interface ReviewActivitySignal {
    namespace: string;
    source: ReviewActivitySource;
    // The review the signal is about; `null` when the sender has none (a list action).
    reviewId: string | null;
    // The target revision the signal is about; `null` when the sender has none.
    targetRevisionId: string | null;
}
```

Modify `packages/app-workflows/src/review/domain/constants.ts`: add after the `WORKFLOWS_NOTIFICATION_ACTION` line:

```ts
export const WORKFLOWS_REVIEW_CHANGED_ACTION = "workflows.reviewChanged";
```

Modify `packages/app-workflows/src/review/notifications/abstractions.ts`: add after the `WorkflowsNotificationData` interface:

```ts

export type WorkflowReviewChangedKind =
    | "requested"
    | "stepStarted"
    | "stepApproved"
    | "stepRestarted";

// The data of a `workflows.reviewChanged` websocket message (R253): ids and namespace only.
export interface WorkflowReviewChangedData {
    kind: WorkflowReviewChangedKind;
    reviewId: string;
    stepId: string | null;
    namespace: string;
    targetId: string;
    targetRevisionId: string;
}
```

Modify `packages/app-workflows/src/review/notifications/ReviewNotificationService.ts`:

```ts
// before
        this.activity.notify({ namespace: data.namespace, source: "remote" });

// after
        this.activity.notify({
            namespace: data.namespace,
            source: "remote",
            reviewId: data.reviewId,
            targetRevisionId: data.targetRevisionId
        });
```

Modify `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.ts`, `actionDone`:

```ts
// before
        this.closeAction();
        await this.refresh();
        this.activity.notify({ namespace: params.target.namespace, source: "own" });
    }

// after
        const reviewBefore = this.review;

        this.closeAction();
        await this.refresh();

        // The review after the action; a cancel leaves none, so the one read before it stands in.
        let reviewId: string | null = null;
        if (this.review) {
            reviewId = this.review.review.id;
        } else if (reviewBefore) {
            reviewId = reviewBefore.review.id;
        }
        this.activity.notify({
            namespace: params.target.namespace,
            source: "own",
            reviewId,
            targetRevisionId: params.target.targetRevisionId
        });
    }
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.ts`, `actionDone`:

```ts
// before
        // Read before the refresh: a failed refresh clears the review, and the lists still need
        // the signal because the action itself succeeded.
        let namespace: string | null = null;
        if (this.review) {
            namespace = this.review.review.namespace;
        }

        this.closeAction();
        await this.refresh();

        if (namespace !== null) {
            this.activity.notify({ namespace, source: "own" });
        }

// after
        // Read before the refresh: a failed refresh clears the review, and the lists still need
        // the signal because the action itself succeeded.
        let namespace: string | null = null;
        let reviewId: string | null = null;
        let targetRevisionId: string | null = null;
        if (this.review) {
            namespace = this.review.review.namespace;
            reviewId = this.review.review.id;
            targetRevisionId = this.review.review.targetRevisionId;
        }

        this.closeAction();
        await this.refresh();

        if (namespace !== null) {
            this.activity.notify({ namespace, source: "own", reviewId, targetRevisionId });
        }
```

Modify `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts`, `actionDone`:

```ts
// before
        this.activity.notify({ namespace: dialog.namespace, source: "own" });

// after
        this.activity.notify({
            namespace: dialog.namespace,
            source: "own",
            reviewId: dialog.reviewId,
            targetRevisionId: null
        });
```

Create `packages/app-workflows/src/review/mounting/ReviewChangeMessageHandler.ts`:

```ts
import type { IncomingGenericData } from "@webiny/app-websockets/types.js";
import type { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import type { ReviewActivity } from "~/review/activity/abstractions.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { WORKFLOWS_REVIEW_CHANGED_ACTION } from "~/review/domain/constants.js";
import type { WorkflowReviewChangedData } from "~/review/notifications/abstractions.js";

interface WorkflowReviewChangedMessage extends IncomingGenericData {
    data?: WorkflowReviewChangedData;
}

/*
 * Turns `workflows.reviewChanged` websocket messages of one app into a refetch signal (R253,
 * R260). The message is silent: nothing is shown, the bar, the drawer, the lists and the widgets
 * refetch what shows the review. Exported as a plain class; each app subclasses it in its own
 * file and binds the subclass to `WebsocketEventHandler`, so the handler of one app ignores the
 * namespaces of the other (R237). `ReviewActivity.notify` isolates listener failures, so a
 * failing listener cannot break the event publisher.
 */
export class ReviewChangeMessageHandler implements WebsocketEventHandler.Interface {
    constructor(
        private activity: ReviewActivity.Interface,
        private adapter: IReviewContentAdapter
    ) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== WORKFLOWS_REVIEW_CHANGED_ACTION) {
            return;
        }

        // The envelope is `{ action, data }`. A malformed message is ignored rather than allowed
        // to throw inside the event publisher.
        const message: WorkflowReviewChangedMessage = event.payload;
        const data = message.data;
        if (!data || typeof data.namespace !== "string") {
            return;
        }
        if (!this.adapter.canHandle(data.namespace)) {
            return;
        }

        let reviewId: string | null = null;
        if (typeof data.reviewId === "string") {
            reviewId = data.reviewId;
        }
        let targetRevisionId: string | null = null;
        if (typeof data.targetRevisionId === "string") {
            targetRevisionId = data.targetRevisionId;
        }

        this.activity.notify({
            namespace: data.namespace,
            source: "remote",
            reviewId,
            targetRevisionId
        });
    }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
yarn test packages/app-workflows/src/review/domain/getWorkflowsPermissionSet.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/review/mounting/ReviewChangeMessageHandler.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/review/activity/ReviewActivity.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/notifications/ReviewNotificationService.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -40
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests that cover the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewWidget 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewList 2>&1 | tail -40
yarn test packages/app-workflows/src/review/mounting 2>&1 | tail -40
yarn test packages/app-workflows/src/review/notifications 2>&1 | tail -40
yarn test packages/app-workflows/src/review/activity 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
grep -rn "WorkflowsSecurityPermissionAccessLevel\|permissions/constants" packages/app-workflows/src
```

Expected: no failures, no type errors, and the grep prints nothing. `app.test.tsx` passes unchanged with the flag on and off (nothing is registered here). The widget and list component tests passed through the mechanical field change. If the build reports another construction of `ReviewActivitySignal` or another reference to the removed enum, add the two fields or replace the use the same way.

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
git commit -m "feat(app-workflows): add the permission set, the review-aware activity signal and the change message handler" \
  -m "useWorkflowsPermission now reads the boolean stored permission over several roles, workflows.* and *, and returns reassign. The 8a hook compared against the string yes and gave workflows.* no editor access." \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" \
  -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step fails and you fix something, rerun the chain from the start. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`.

**Contract notes:**
- `presentation/permissions/constants.ts` is deleted (not in the contract): its single constant was used only by the rewritten hook, and the domain function must not import from `presentation/`.
- The contract says the four callers pass the new fields "(`null` when they have none)". The list presenter passes the dialog's review id and `null` for the revision (the dialog request holds no revision id); the bar presenter prefers the review after the refresh and falls back to the one before it.
- `ReviewChangeMessageHandler`'s constructor takes `(activity, adapter)`; Tasks 17 and 18 must list `[ReviewActivity, <App>ReviewContentAdapter]` as the dependencies of their subclass (the existing `CmsReviewNotificationHandlerImpl` lists `[ReviewNotificationService, CmsReviewContentAdapter]`).
- `ReviewActivity` is both the abstraction token and the namespace of its types in `~/review/activity/abstractions.js` (verified); the handler imports it as a type only.
