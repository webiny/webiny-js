### Task 8: `WorkflowBypassService` and the save block bypass

Spec 9.2; D36, D62, D84, D134; R150; Review Focus 3. The automation (and later AI) handler may change the target while its review is active, which the save block `BlockUpdateWhileInReview` forbids for everybody else. D36 and D62 exempt exactly that block; nothing exempts the move rule (D84) or the delete and trash blocks (D134). So:

- New request-scoped DI service `WorkflowBypassService` (`features/bypass/WorkflowBypassService/`): `run<T>(callback: () => Promise<T>): Promise<T>` and `isActive(): boolean`. It holds one boolean on the instance. `run` remembers the previous value, sets the flag, awaits the callback and restores the previous value in `finally` (so a throwing callback restores it and a nested `run` leaves the outer one active). It returns the callback's value and lets its error propagate. It has no dependencies: it does not touch `IdentityContext` and does not widen permissions.
- Registered in `WorkflowsFeature` with `inSingletonScope()`, so every consumer of one request container shares one flag (like `CurrentUserTeams`).
- Only the run handler (Task 12) will call `run`, around `AutomationDefinition.run`; wrappers and GraphQL never do. This task adds no caller.
- Only `BlockUpdateWhileInReview` (`packages/api-headless-cms-workflows`, covers CMS entries and, through `WbPageReviewNamespace`, WB pages) injects the service and returns early when `isActive()`, as the first statement of `handle`, before the namespace and binding lookups. `BlockMoveWhileInReview`, `BlockFolderChangeWhileInReview`, the delete and trash blocks and the WB page move block stay unchanged and `api-website-builder-workflows` is not touched. The doc comment on the class replaces the "Phase 5 adds the automation and AI bypass context here" sentence.

**Files:**
- Create: `packages/api-workflows/src/features/bypass/WorkflowBypassService/abstractions.ts`
- Create: `packages/api-workflows/src/features/bypass/WorkflowBypassService/WorkflowBypassService.ts`
- Create: `packages/api-workflows/src/features/bypass/WorkflowBypassService/feature.ts`
- Create: `packages/api-workflows/src/features/bypass/WorkflowBypassService/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/hooks/BlockUpdateWhileInReview.ts`
- Create: `packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/hooks/publishAndMove.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts`

**Interfaces:**
- Consumes (existing code):
  - `createFeature`, `createAbstraction` (`@webiny/feature/api`); `container.register(X).inSingletonScope()` as in `CurrentUserTeamsFeature`.
  - `EntryBeforeUpdateEventHandler` and the current `BlockUpdateWhileInReviewImpl` (`namespaces`, `getBoundWorkflow`, `getTargetReview`).
  - Test helpers in `api-workflows`: `createContextHandler()` (`~tests/__helpers/handler.js`, returns `{ context }` with `context.container`). In `api-headless-cms-workflows`: `createTestContext`, `createAuthorEntry`, `getAuthorModel`, `requestEntryReview`, `cancelEntryReview` and the `updateName`, `move`, `trash` helpers local to the hook tests.
- Produces:
  - `WorkflowBypassService` (`@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js`): `run<T>(callback: () => Promise<T>): Promise<T>`, `isActive(): boolean`; namespace type `WorkflowBypassService.Interface`. Feature `WorkflowBypassServiceFeature`. Consumed by Task 12.
  - `BlockUpdateWhileInReview` skips when `isActive()`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";

const createService = async () => {
    const { context } = await createContextHandler();
    return context.container.resolve(WorkflowBypassService);
};

describe("WorkflowBypassService (D36, D62, R150)", () => {
    it("is inactive by default", async () => {
        const service = await createService();

        expect(service.isActive()).toBe(false);
    });

    it("is active inside the callback and inactive after it", async () => {
        const service = await createService();
        const seen: boolean[] = [];

        const result = await service.run(async () => {
            seen.push(service.isActive());
            await Promise.resolve();
            seen.push(service.isActive());
            return "done";
        });

        expect(result).toBe("done");
        expect(seen).toEqual([true, true]);
        expect(service.isActive()).toBe(false);
    });

    it("restores the flag when the callback throws", async () => {
        const service = await createService();

        const failing = service.run(async () => {
            throw new Error("automation failed");
        });

        await expect(failing).rejects.toThrow("automation failed");
        expect(service.isActive()).toBe(false);
    });

    it("keeps the outer run active when a nested run ends", async () => {
        const service = await createService();
        const seen: boolean[] = [];

        await service.run(async () => {
            await service.run(async () => {
                seen.push(service.isActive());
            });
            seen.push(service.isActive());
        });

        expect(seen).toEqual([true, true]);
        expect(service.isActive()).toBe(false);
    });

    it("is one instance per request container, so every consumer shares the flag", async () => {
        const { context } = await createContextHandler();
        const first = context.container.resolve(WorkflowBypassService);
        const second = context.container.resolve(WorkflowBypassService);
        const seen: boolean[] = [];

        await first.run(async () => {
            seen.push(second.isActive());
        });

        expect(seen).toEqual([true]);
        expect(second.isActive()).toBe(false);
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts`, add the import after the `CandidateReadAccess` import:

```ts
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
```

and the assertion after `expect(container.resolveAll(CurrentReviewViewer)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(WorkflowBypassService)).toHaveLength(1);
```

In `packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts`, add the import after the `DeleteWorkflowUseCase` import:

```ts
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
```

and add inside `describe("Revision create and save block", ...)`, after the test `"blocks updating a revision under review and allows it after cancel (D62)"`:

```ts
    it("lets the save through while the bypass is active, and only then (D36, D62, R150)", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);
        const bypass = context.container.resolve(WorkflowBypassService);

        const bypassed = await bypass.run(() => updateName(context, entry.id, "By automation"));
        const blockedAfter = await updateName(context, entry.id, "By someone else");

        expect(bypassed.isOk()).toBe(true);
        expect((await readEntry(context, entry.id)).values.name).toBe("By automation");
        expect(blockedAfter.isFail()).toBe(true);
        expect(blockedAfter.error.code).toBe("Workflows/Review/TargetLocked");
        expect(blockedAfter.error.data).toMatchObject({ reviewId: review.id, action: "update" });
    });

    it("blocks the save again after a bypassed callback throws (finally)", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);
        const bypass = context.container.resolve(WorkflowBypassService);

        await expect(
            bypass.run(async () => {
                throw new Error("automation failed");
            })
        ).rejects.toThrow("automation failed");
        const blocked = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
    });

    it("does not look up the binding or the review while the bypass is active", async () => {
        const { context } = await createWorkflowContext([countEngineCalls]);
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);
        engineCalls.length = 0;
        const bypass = context.container.resolve(WorkflowBypassService);

        await bypass.run(() => updateName(context, entry.id, "By automation"));

        expect(engineCalls).toEqual([]);
    });
```

In `packages/api-headless-cms-workflows/__tests__/hooks/publishAndMove.test.ts`, add the import after the `RepublishEntryUseCase` import:

```ts
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
```

and add inside `describe("CMS move rule (D84)", ...)`, after its first test:

```ts
    it("does not exempt the move rule from the bypass (D84, R150)", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        await requestEntryReview(context, entry);
        const bypass = context.container.resolve(WorkflowBypassService);

        const blocked = await bypass.run(() => move(context, entry, "folder-2"));

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
        expect(blocked.error.data).toMatchObject({ action: "move", reviewState: "inProgress" });
    });
```

In `packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts`, add the import with the other `@webiny/api-workflows` import:

```ts
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
```

and add inside `describe("CMS trash with a review in progress (D134)", ...)`, after its first test:

```ts
    it("does not exempt trash or permanent delete from the bypass (D134, R150)", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);
        const bypass = context.container.resolve(WorkflowBypassService);

        const trashed = await bypass.run(() => trash(context, entry));
        const deleted = await bypass.run(() => deletePermanently(context, entry));

        expect(trashed.isFail()).toBe(true);
        expect(trashed.error.code).toBe("Workflows/Review/TargetLocked");
        expect(deleted.isFail()).toBe(true);
        expect(deleted.error.code).toBe("Workflows/Review/TargetLocked");
    });
```

(Read the first test of each describe in the file and place the new test directly after it; the helper names `trash`, `deletePermanently`, `move`, `updateName`, `readEntry`, `countEngineCalls`, `engineCalls` already exist in these files.)

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, the module `~/features/bypass/WorkflowBypassService/index.js` does not exist.

Run: `yarn test packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts packages/api-headless-cms-workflows/__tests__/hooks/publishAndMove.test.ts packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts 2>&1 | tail -50`
Expected: FAIL, the import of `WorkflowBypassService` cannot be resolved.

Run the CMS files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts packages/api-headless-cms-workflows/__tests__/hooks/publishAndMove.test.ts packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: The service**

Create `packages/api-workflows/src/features/bypass/WorkflowBypassService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface IWorkflowBypassService {
    /**
     * Runs the callback with the bypass flag set and restores the previous value in `finally`,
     * also when the callback throws. Only the step run handler calls it, around the automation
     * (R150). It does not touch the identity and does not widen permissions.
     */
    run<T>(callback: () => Promise<T>): Promise<T>;
    /** Whether a `run` is in progress on this request container. */
    isActive(): boolean;
}

/**
 * Request-scoped bypass context (D36, D62, spec 9.2). Only the save block
 * (`BlockUpdateWhileInReview`) reads it; the move rule and the delete and trash blocks do not.
 */
export const WorkflowBypassService =
    createAbstraction<IWorkflowBypassService>("WorkflowBypassService");

export namespace WorkflowBypassService {
    export type Interface = IWorkflowBypassService;
}
```

Create `packages/api-workflows/src/features/bypass/WorkflowBypassService/WorkflowBypassService.ts`:

```ts
import { WorkflowBypassService as Abstraction } from "./abstractions.js";

class WorkflowBypassServiceImpl implements Abstraction.Interface {
    private active = false;

    public async run<T>(callback: () => Promise<T>): Promise<T> {
        const previous = this.active;
        this.active = true;
        try {
            return await callback();
        } finally {
            this.active = previous;
        }
    }

    public isActive(): boolean {
        return this.active;
    }
}

export const WorkflowBypassService = Abstraction.createImplementation({
    implementation: WorkflowBypassServiceImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/features/bypass/WorkflowBypassService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WorkflowBypassService } from "./WorkflowBypassService.js";

export const WorkflowBypassServiceFeature = createFeature({
    name: "Workflows/WorkflowBypassService",
    register(container) {
        // One instance per request container, so every consumer in the request shares one flag.
        container.register(WorkflowBypassService).inSingletonScope();
    }
});
```

Create `packages/api-workflows/src/features/bypass/WorkflowBypassService/index.ts`:

```ts
export { WorkflowBypassService } from "./abstractions.js";
```

In `packages/api-workflows/src/WorkflowsFeature.ts`, add after the `CandidateReadAccessFeature` import:

```ts
import { WorkflowBypassServiceFeature } from "~/features/bypass/WorkflowBypassService/feature.js";
```

and after `CandidateReadAccessFeature.register(container);`:

```ts

        // Bypass context for the automation run (D36, D62, R150); only the save block reads it
        WorkflowBypassServiceFeature.register(container);
```

- [ ] **Step 4: The save block**

In `packages/api-headless-cms-workflows/src/features/hooks/BlockUpdateWhileInReview.ts`, add the import after the `GetTargetReviewUseCase` import:

```ts
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
```

Replace the class doc comment's last sentence and the constructor and first lines of `handle`:

```ts
 * publishes `EntryBeforeUpdateRevisionDescription`; metadata only, not content). The automation
 * run is exempt too (D36, D62, R150): while `WorkflowBypassService.isActive()` the handler returns
 * before the binding lookup. Only this save block honours the bypass; the move rule (D84) and the
 * delete and trash blocks (D134) do not.
 */
class BlockUpdateWhileInReviewImpl implements EntryBeforeUpdateEventHandler.Interface {
    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private namespaces: CmsEntryReviewNamespace.Interface[],
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
        if (this.bypass.isActive()) {
            return;
        }

        const { model, original } = event.payload;
```

(the rest of `handle` is unchanged) and the registration:

```ts
export const BlockUpdateWhileInReview = EntryBeforeUpdateEventHandler.createImplementation({
    implementation: BlockUpdateWhileInReviewImpl,
    dependencies: [
        WorkflowBypassService,
        [CmsEntryReviewNamespace, { multiple: true }],
        GetBoundWorkflowUseCase,
        GetTargetReviewUseCase
    ]
});
```

- [ ] **Step 5: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts packages/api-headless-cms-workflows/__tests__/hooks/publishAndMove.test.ts packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS (the new bypass tests and the unchanged D62, D84, D134 tests).

Run the same CMS files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts packages/api-headless-cms-workflows/__tests__/hooks/publishAndMove.test.ts packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Run the Website Builder tests covering the save block**

`BlockUpdateWhileInReview` also covers WB pages (`WbPageReviewNamespace`); the WB package is not edited, so run its existing save-block tests by path to prove it is unaffected:

Run: `yarn test packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts 2>&1 | tail -50` and the same with `yarn test:os`.
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` and `@webiny/api-headless-cms-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the workflow bypass service and skip the save block while it is active

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
