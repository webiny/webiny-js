### Task 9: `ReviewTargetEditor` port, `ReviewTargetEditorService` and `ReviewTargetEditorError`

Spec 9.3; D55, D132; R87, R172, R173; A58; Review Focus 3 (the port's contract), Review Focus 4 (the fake records the bypass state the tool tests read). The port the AI tools read and write the content under review through, the service that picks the adapter, the error type and the test fake. No adapter and no tool ships in this task (Tasks 11-13 build the adapters, Task 10 the tools):

- `ReviewTargetEditor` (`features/review/ReviewTargetEditor/`) is a multi-registered abstraction like `ReviewTargetLoader` (spec 9.3), one implementation per namespace (`cms.*`, `wb.page`), registered by the app target adapters under their own flags. `canEdit(model)` says whether it handles the namespace id. `read({ model, targetId, targetRevisionId })` returns `ReviewTargetContent { title, fields[] }`; every field is `{ path, label, type, value, writable }` (R172: `writable` is the adapter's verdict, so the model is told what it may write). `update({ model, targetId, targetRevisionId, values })` takes `values: Record<string, unknown>` keyed by field path and returns `{ applied: string[] }`. Both return a `Result`: a refusal (unknown path, read-only path, a value the target rejects) is a failed `Result` with a `ReviewTargetEditorError`, never a throw.
- `ReviewTargetEditorError` (`domain/review/errors.ts`, code `Workflows/ReviewTarget/EditorError`) carries only a message that is safe to show the model (R172, R87): a validation text or a generic text; an adapter logs the real error and never puts a provider or storage error in it. Its constructor takes the message.
- `ReviewTargetEditorService` (`features/review/ReviewTargetEditorService/`) is the one place that selects the adapter: `read` and `update` take the same params as the port, pick the LAST registered editor whose `canEdit(model)` is true (the `RequestReviewUseCase` rule for `ReviewTargetLoader`, A10) and delegate. No editor matches: a failed `Result` with `ReviewTargetEditorError("This target cannot be edited.")`. The service does no permission check (D132) and does not catch a throw: the tools (Task 10) turn a throw into a tool error text (R87). It does not apply the bypass or the stale check either: those belong to the tool that writes (R173). Registered by `ReviewLifecycleFeature` (the adapters register the editors, the way they register the loaders).
- `FakeReviewTargetEditor` (test helper) handles `cms.article` only, serves `fakeEditor.content` (title plus a writable `title`, a writable `body` and a read-only `author` field), records every `read` and `update` call, and applies a `values` object atomically to its own content (an unknown or read-only path fails the whole call with `The field "<path>" cannot be written.`). Every recorded `update` call also carries the bypass state the fake saw (`bypassActiveAtStart` and, after one awaited tick, `bypassActiveAfterAwait`) and `finished`, which Task 10 reads to pin R173. Faults (`readFault`, `updateFault`: `"fail"` or `"throw"`) and a gate that holds an `update` in flight (`holdFakeEditorUpdate`) serve the same tests.

**Files:**
- Modify: `packages/api-workflows/src/domain/review/errors.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetEditor/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetEditor/index.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetEditorService/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetEditorService/ReviewTargetEditorService.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetEditorService/index.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeReviewTargetEditor.ts`
- Create: `packages/api-workflows/__tests__/review/ReviewTargetEditorService.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts` (two added assertions; no existing expectation changes)

**Interfaces:**
- Consumes:
  - Existing: `createAbstraction`, `BaseError`, `Result` (`@webiny/feature/api`), `ReviewTargetLoader` (`~/features/review/ReviewTargetLoader/index.js`, the model for the abstraction and the last-match rule), `WorkflowBypassService` (`~/features/bypass/WorkflowBypassService/index.js`, `run`, `isActive`; the fake only reads `isActive`).
  - Test helpers (reused, never redefined): `createContextHandler` (`~tests/__helpers/handler.js`), `ARTICLE_MODEL`, `expectOk` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - `ReviewTargetEditor` (`~/features/review/ReviewTargetEditor/index.js`), namespace types `Interface`, `Field`, `Content`, `ReadParams`, `UpdateParams`, `UpdateResult`; also exported: `IReviewTargetEditor`, `ReviewTargetEditorField`, `ReviewTargetContent`, `ReviewTargetEditorReadParams`, `ReviewTargetEditorUpdateParams`, `ReviewTargetEditorUpdateResult`. Consumed by Tasks 10-13, 19.
  - `ReviewTargetEditorError` (`~/domain/review/errors.js`, code `Workflows/ReviewTarget/EditorError`). Consumed by Tasks 10-13, 19.
  - `ReviewTargetEditorService` (`~/features/review/ReviewTargetEditorService/index.js`): `read(params): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>>`, `update(params): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>>`. Consumed by Tasks 10, 19.
  - Test helper `FakeReviewTargetEditor`, `fakeEditor`, `resetFakeEditor`, `createFakeEditorContent`, `holdFakeEditorUpdate` (`~tests/__helpers/FakeReviewTargetEditor.js`), reused by Tasks 10 and 19.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/FakeReviewTargetEditor.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewTargetEditorError } from "~/domain/review/errors.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/index.js";
import { ARTICLE_MODEL } from "./fixtures.js";

export type FakeEditorFault = "none" | "fail" | "throw";

/** One `update` call as the fake saw it. */
export interface FakeEditorUpdateCall extends ReviewTargetEditor.UpdateParams {
    /** `WorkflowBypassService.isActive()` when `update` was entered. */
    bypassActiveAtStart: boolean;
    /** The same, after the fake awaited (the gate, or one tick): still inside the bypass scope. */
    bypassActiveAfterAwait: boolean;
    /** True once the fake got past its await, so a caller that did not await `update` shows false. */
    finished: boolean;
}

export interface FakeEditorState {
    /** What `read` answers and `update` changes. */
    content: ReviewTargetEditor.Content;
    readCalls: ReviewTargetEditor.ReadParams[];
    updateCalls: FakeEditorUpdateCall[];
    readFault: FakeEditorFault;
    updateFault: FakeEditorFault;
    /** The message of a failed `read` or `update` (`fail`). */
    faultMessage: string;
    /** When set, `update` waits for it before it answers (see `holdFakeEditorUpdate`). */
    gate: Promise<void> | null;
    /** Called when `update` was entered and recorded. */
    onUpdateStarted: (() => void) | null;
}

export const createFakeEditorContent = (): ReviewTargetEditor.Content => {
    return {
        title: "Article article-1",
        fields: [
            { path: "title", label: "Title", type: "text", value: "Hello", writable: true },
            { path: "body", label: "Body", type: "long-text", value: "Body text", writable: true },
            {
                path: "author",
                label: "Author",
                type: "ref",
                value: { id: "author-1" },
                writable: false
            }
        ]
    };
};

/** Shared by the fake and the tests. Call `resetFakeEditor()` in `beforeEach`. */
export const fakeEditor: FakeEditorState = {
    content: createFakeEditorContent(),
    readCalls: [],
    updateCalls: [],
    readFault: "none",
    updateFault: "none",
    faultMessage: "The value of \"title\" is not valid.",
    gate: null,
    onUpdateStarted: null
};

export const resetFakeEditor = (): void => {
    fakeEditor.content = createFakeEditorContent();
    fakeEditor.readCalls.length = 0;
    fakeEditor.updateCalls.length = 0;
    fakeEditor.readFault = "none";
    fakeEditor.updateFault = "none";
    fakeEditor.faultMessage = "The value of \"title\" is not valid.";
    fakeEditor.gate = null;
    fakeEditor.onUpdateStarted = null;
};

export interface HeldUpdate {
    /** Resolves once an `update` call was entered and is waiting. */
    started: Promise<void>;
    /** Lets the waiting `update` go on. */
    release(): void;
}

/** Holds the next `update` call in flight until `release()`, to test what happens meanwhile. */
export const holdFakeEditorUpdate = (): HeldUpdate => {
    let release: () => void = () => undefined;
    let markStarted: () => void = () => undefined;
    fakeEditor.gate = new Promise<void>(resolve => {
        release = resolve;
    });
    const started = new Promise<void>(resolve => {
        markStarted = resolve;
    });
    fakeEditor.onUpdateStarted = markStarted;
    return { started, release };
};

/** Handles "cms.article" only; serves and changes `fakeEditor.content`. */
class FakeReviewTargetEditorImpl implements ReviewTargetEditor.Interface {
    public constructor(private bypass: WorkflowBypassService.Interface) {}

    public canEdit(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    public async read(
        params: ReviewTargetEditor.ReadParams
    ): Promise<Result<ReviewTargetEditor.Content, ReviewTargetEditorError>> {
        fakeEditor.readCalls.push(params);
        if (fakeEditor.readFault === "throw") {
            throw new Error("Storage threw.");
        }
        if (fakeEditor.readFault === "fail") {
            return Result.fail(new ReviewTargetEditorError(fakeEditor.faultMessage));
        }
        return Result.ok(fakeEditor.content);
    }

    public async update(
        params: ReviewTargetEditor.UpdateParams
    ): Promise<Result<ReviewTargetEditor.UpdateResult, ReviewTargetEditorError>> {
        const call: FakeEditorUpdateCall = {
            ...params,
            bypassActiveAtStart: this.bypass.isActive(),
            bypassActiveAfterAwait: false,
            finished: false
        };
        fakeEditor.updateCalls.push(call);
        fakeEditor.onUpdateStarted?.();
        await (fakeEditor.gate ?? Promise.resolve());
        call.bypassActiveAfterAwait = this.bypass.isActive();
        call.finished = true;

        if (fakeEditor.updateFault === "throw") {
            throw new Error("Storage threw.");
        }
        if (fakeEditor.updateFault === "fail") {
            return Result.fail(new ReviewTargetEditorError(fakeEditor.faultMessage));
        }
        // Atomic: check every path first, then apply.
        const paths = Object.keys(params.values);
        for (const path of paths) {
            const field = fakeEditor.content.fields.find(item => item.path === path);
            if (!field || !field.writable) {
                return Result.fail(
                    new ReviewTargetEditorError(`The field "${path}" cannot be written.`)
                );
            }
        }
        for (const path of paths) {
            const field = fakeEditor.content.fields.find(item => item.path === path);
            if (field) {
                field.value = params.values[path];
            }
        }
        return Result.ok({ applied: paths });
    }
}

export const FakeReviewTargetEditor = ReviewTargetEditor.createImplementation({
    implementation: FakeReviewTargetEditorImpl,
    dependencies: [WorkflowBypassService]
});
```

Create `packages/api-workflows/__tests__/review/ReviewTargetEditorService.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ARTICLE_MODEL, expectOk } from "~tests/__helpers/fixtures.js";
import {
    FakeReviewTargetEditor,
    fakeEditor,
    resetFakeEditor
} from "~tests/__helpers/FakeReviewTargetEditor.js";
import { ReviewTargetEditorError } from "~/domain/review/errors.js";
import { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/index.js";
import { ReviewTargetEditorService } from "~/features/review/ReviewTargetEditorService/index.js";

const READ_PARAMS: ReviewTargetEditor.ReadParams = {
    model: ARTICLE_MODEL,
    targetId: "article-1",
    targetRevisionId: "article-1#0001"
};

const UPDATE_PARAMS: ReviewTargetEditor.UpdateParams = {
    ...READ_PARAMS,
    values: { title: "New title" }
};

/** A second editor for the same namespace, registered after the fake: the last match wins. */
class SecondEditorImpl implements ReviewTargetEditor.Interface {
    public canEdit(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    public async read(): Promise<Result<ReviewTargetEditor.Content, ReviewTargetEditorError>> {
        return Result.ok({ title: "Second editor", fields: [] });
    }

    public async update(): Promise<
        Result<ReviewTargetEditor.UpdateResult, ReviewTargetEditorError>
    > {
        return Result.ok({ applied: ["second"] });
    }
}

const SecondEditor = ReviewTargetEditor.createImplementation({
    implementation: SecondEditorImpl,
    dependencies: []
});

/** An editor for another namespace, registered after the fake: it must not be picked for articles. */
class PageEditorImpl implements ReviewTargetEditor.Interface {
    public canEdit(model: string): boolean {
        return model === "wb.page";
    }

    public async read(): Promise<Result<ReviewTargetEditor.Content, ReviewTargetEditorError>> {
        return Result.ok({ title: "Page editor", fields: [] });
    }

    public async update(): Promise<
        Result<ReviewTargetEditor.UpdateResult, ReviewTargetEditorError>
    > {
        return Result.ok({ applied: ["page"] });
    }
}

const PageEditor = ReviewTargetEditor.createImplementation({
    implementation: PageEditorImpl,
    dependencies: []
});

const createService = async (register: Array<typeof FakeReviewTargetEditor> = []) => {
    const { context } = await createContextHandler({
        setup: container => {
            for (const implementation of register) {
                container.register(implementation);
            }
        }
    });
    return context.container.resolve(ReviewTargetEditorService);
};

describe("ReviewTargetEditorError (R172)", () => {
    it("has its own code and carries the message it is given", () => {
        const error = new ReviewTargetEditorError("The field \"title\" cannot be written.");

        expect(error.code).toBe("Workflows/ReviewTarget/EditorError");
        expect(error.message).toBe("The field \"title\" cannot be written.");
    });
});

describe("ReviewTargetEditorService (spec 9.3, R172)", () => {
    beforeEach(() => {
        resetFakeEditor();
    });

    it("reads through the editor that handles the namespace", async () => {
        const service = await createService([FakeReviewTargetEditor]);

        const content = expectOk(await service.read(READ_PARAMS));

        expect(content).toEqual(fakeEditor.content);
        expect(content.fields.map(field => [field.path, field.writable])).toEqual([
            ["title", true],
            ["body", true],
            ["author", false]
        ]);
        expect(fakeEditor.readCalls).toEqual([READ_PARAMS]);
    });

    it("updates through the editor that handles the namespace and returns the applied paths", async () => {
        const service = await createService([FakeReviewTargetEditor]);

        const result = expectOk(await service.update(UPDATE_PARAMS));

        expect(result).toEqual({ applied: ["title"] });
        expect(fakeEditor.updateCalls).toHaveLength(1);
        expect(fakeEditor.updateCalls[0]).toMatchObject(UPDATE_PARAMS);
        expect(fakeEditor.content.fields[0].value).toBe("New title");
    });

    it("fails with a message safe for the model when no editor handles the namespace", async () => {
        const service = await createService();

        const read = await service.read(READ_PARAMS);
        const update = await service.update(UPDATE_PARAMS);

        expect(read.error).toBeInstanceOf(ReviewTargetEditorError);
        expect(read.error.message).toBe("This target cannot be edited.");
        expect(update.error).toBeInstanceOf(ReviewTargetEditorError);
        expect(update.error.message).toBe("This target cannot be edited.");
    });

    it("fails for a namespace its editors do not handle, without calling them", async () => {
        const service = await createService([FakeReviewTargetEditor]);

        const read = await service.read({ ...READ_PARAMS, model: "cms.other" });
        const update = await service.update({ ...UPDATE_PARAMS, model: "cms.other" });

        expect(read.error.message).toBe("This target cannot be edited.");
        expect(update.error.message).toBe("This target cannot be edited.");
        expect(fakeEditor.readCalls).toEqual([]);
        expect(fakeEditor.updateCalls).toEqual([]);
    });

    it("picks the last registered editor that handles the namespace", async () => {
        const service = await createService([FakeReviewTargetEditor, SecondEditor]);

        const content = expectOk(await service.read(READ_PARAMS));
        const result = expectOk(await service.update(UPDATE_PARAMS));

        expect(content.title).toBe("Second editor");
        expect(result).toEqual({ applied: ["second"] });
        expect(fakeEditor.readCalls).toEqual([]);
        expect(fakeEditor.updateCalls).toEqual([]);
    });

    it("skips a later editor that does not handle the namespace", async () => {
        const service = await createService([FakeReviewTargetEditor, PageEditor]);

        const article = expectOk(await service.read(READ_PARAMS));
        const page = expectOk(await service.read({ ...READ_PARAMS, model: "wb.page" }));

        expect(article.title).toBe("Article article-1");
        expect(page.title).toBe("Page editor");
    });

    it("returns the editor's refusal unchanged", async () => {
        const service = await createService([FakeReviewTargetEditor]);

        const result = await service.update({ ...UPDATE_PARAMS, values: { author: "x" } });

        expect(result.error).toBeInstanceOf(ReviewTargetEditorError);
        expect(result.error.message).toBe('The field "author" cannot be written.');
        expect(fakeEditor.content.fields[2].value).toEqual({ id: "author-1" });
    });
});
```

Modify `packages/api-workflows/__tests__/registration.test.ts`. Add the import next to the `ReviewTargetFolderChain` import:

```ts
import { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/index.js";
import { ReviewTargetEditorService } from "~/features/review/ReviewTargetEditorService/index.js";
```

and, directly after the line `expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(0);`, add:

```ts
        // The editor service is registered; the adapters register the editors (Tasks 11-13).
        expect(container.resolveAll(ReviewTargetEditorService)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(0);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewTargetEditorService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. The imports of `~/features/review/ReviewTargetEditor/index.js`, `~/features/review/ReviewTargetEditorService/index.js` and the `ReviewTargetEditorError` export cannot be resolved.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/ReviewTargetEditorService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: the same failure.

- [ ] **Step 3: Implement**

Append to `packages/api-workflows/src/domain/review/errors.ts`:

```ts
/**
 * A target editor refused or could not do what the AI tool asked (R172): an unknown or read-only
 * path, a value the target rejects, or no editor for the namespace. The message is shown to the
 * model, so it holds only a validation text or a generic text, never a provider or storage error
 * (the adapter logs that one, R87). Returned by `ReviewTargetEditor` and `ReviewTargetEditorService`.
 */
export class ReviewTargetEditorError extends BaseError {
    override readonly code = "Workflows/ReviewTarget/EditorError" as const;

    constructor(message: string) {
        super({ message });
    }
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetEditor/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewTargetEditorError } from "~/domain/review/errors.js";

export interface ReviewTargetEditorField {
    /** The key `update` takes: a field id, or dotted ids for a nested object (`address.street`). */
    path: string;
    label: string;
    /** The target's own field type, e.g. "text", "long-text", "number", "object". */
    type: string;
    value: unknown;
    /** Whether `update` accepts this path (R172). The model is told, so it does not try the rest. */
    writable: boolean;
}

export interface ReviewTargetContent {
    title: string;
    fields: ReviewTargetEditorField[];
}

export interface ReviewTargetEditorReadParams {
    /** Namespace id, e.g. "cms.article" or "wb.page" (D41). */
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface ReviewTargetEditorUpdateParams extends ReviewTargetEditorReadParams {
    /** The new values by field path, as read. */
    values: Record<string, unknown>;
}

export interface ReviewTargetEditorUpdateResult {
    /** The paths that were written. */
    applied: string[];
}

export interface IReviewTargetEditor {
    /** Whether this editor handles the namespace id, e.g. "cms.article" or "wb.page". */
    canEdit(model: string): boolean;
    /**
     * The whole content under review, every field with `writable`. Fails with a
     * `ReviewTargetEditorError` (target not found, not readable); never throws.
     */
    read(
        params: ReviewTargetEditorReadParams
    ): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>>;
    /**
     * Writes the bounded set of fields (R172), atomically: any path that is unknown or read-only,
     * or any value the target rejects, fails the whole call and writes nothing. It does not check
     * permissions or stale state and does not apply the bypass: the tool that calls it does (R173).
     * Never throws; a non-validation failure is logged by the adapter and answered with a generic
     * message.
     */
    update(
        params: ReviewTargetEditorUpdateParams
    ): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>>;
}

/**
 * Reads and writes the content under review for the AI tools (spec 9.3). One implementation per
 * namespace, registered by the app target adapters (`cms.*`, `wb.page`); the last registered match
 * wins (A10). The engine reaches it only through `ReviewTargetEditorService`.
 */
export const ReviewTargetEditor = createAbstraction<IReviewTargetEditor>("ReviewTargetEditor");

export namespace ReviewTargetEditor {
    export type Interface = IReviewTargetEditor;
    export type Field = ReviewTargetEditorField;
    export type Content = ReviewTargetContent;
    export type ReadParams = ReviewTargetEditorReadParams;
    export type UpdateParams = ReviewTargetEditorUpdateParams;
    export type UpdateResult = ReviewTargetEditorUpdateResult;
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetEditor/index.ts`:

```ts
export { ReviewTargetEditor } from "./abstractions.js";
export type {
    IReviewTargetEditor,
    ReviewTargetContent,
    ReviewTargetEditorField,
    ReviewTargetEditorReadParams,
    ReviewTargetEditorUpdateParams,
    ReviewTargetEditorUpdateResult
} from "./abstractions.js";
```

Create `packages/api-workflows/src/features/review/ReviewTargetEditorService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewTargetEditorError } from "~/domain/review/errors.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorReadParams,
    ReviewTargetEditorUpdateParams,
    ReviewTargetEditorUpdateResult
} from "~/features/review/ReviewTargetEditor/abstractions.js";

export interface IReviewTargetEditorService {
    /** Reads through the last registered editor that handles `params.model`. */
    read(
        params: ReviewTargetEditorReadParams
    ): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>>;
    /** Writes through the last registered editor that handles `params.model`. */
    update(
        params: ReviewTargetEditorUpdateParams
    ): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>>;
}

/**
 * Picks the target editor for a namespace (spec 9.3). Internal (D132): no permission checks, no
 * stale check and no bypass; the AI tools that call it own those (R173).
 */
export const ReviewTargetEditorService = createAbstraction<IReviewTargetEditorService>(
    "ReviewTargetEditorService"
);

export namespace ReviewTargetEditorService {
    export type Interface = IReviewTargetEditorService;
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetEditorService/ReviewTargetEditorService.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewTargetEditorError } from "~/domain/review/errors.js";
import { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/abstractions.js";
import { ReviewTargetEditorService as Abstraction } from "./abstractions.js";

class ReviewTargetEditorServiceImpl implements Abstraction.Interface {
    public constructor(private editors: ReviewTargetEditor.Interface[]) {}

    public async read(params: ReviewTargetEditor.ReadParams) {
        // Several editors may match (a generic one and a specific one); the last registered wins,
        // the same rule as `ReviewTargetLoader` in `RequestReviewUseCase`.
        const editor = [...this.editors].reverse().find(item => item.canEdit(params.model));
        if (!editor) {
            return Result.fail(new ReviewTargetEditorError("This target cannot be edited."));
        }
        return editor.read(params);
    }

    public async update(params: ReviewTargetEditor.UpdateParams) {
        const editor = [...this.editors].reverse().find(item => item.canEdit(params.model));
        if (!editor) {
            return Result.fail(new ReviewTargetEditorError("This target cannot be edited."));
        }
        return editor.update(params);
    }
}

export const ReviewTargetEditorService = Abstraction.createImplementation({
    implementation: ReviewTargetEditorServiceImpl,
    dependencies: [[ReviewTargetEditor, { multiple: true }]]
});
```

Create `packages/api-workflows/src/features/review/ReviewTargetEditorService/index.ts`:

```ts
export { ReviewTargetEditorService } from "./abstractions.js";
```

In `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts` add the import next to the `ReviewSaver` import:

```ts
import { ReviewTargetEditorService } from "./ReviewTargetEditorService/ReviewTargetEditorService.js";
```

extend the doc comment sentence about the adapters (`The app target adapters register one `ReviewTargetLoader`, `ReviewTargetSync`, `ReviewTargetReadAccess` and `ReviewTargetFolderChain` per namespace`) so it also names the editor:

```ts
 * Defaults for the review lifecycle. The app target adapters register one `ReviewTargetLoader`,
 * `ReviewTargetSync`, `ReviewTargetReadAccess`, `ReviewTargetFolderChain` and `ReviewTargetEditor`
 * per namespace
```

(the rest of the comment, `(`cms.*` in api-headless-cms-workflows, ...`, stays) and register the service after `ReviewSaver`:

```ts
        container.register(ReviewSaver);
        // Picks the AI tools' target editor per namespace (spec 9.3); the adapters register them
        container.register(ReviewTargetEditorService);
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewTargetEditorService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/ReviewTargetEditorService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors.

- [ ] **Step 5: Run the existing tests covering the changed code**

`ReviewLifecycleFeature` gained one registration and `errors.ts` gained one class; nothing else changed:

Run: `yarn test packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
git commit -m "feat(api-workflows): add the ReviewTargetEditor port and service" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```
