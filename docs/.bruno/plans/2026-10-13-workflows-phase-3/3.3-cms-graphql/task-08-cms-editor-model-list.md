### Task 8: CMS editor model list (D116)

Spec 4.1, 10; D15, D41, D116, D130, D133; R38, R87, R99. The workflow editor picks the model to bind from a searchable, paged list instead of every model at once. `ListCmsEntryWorkflowModelsUseCase` checks `editor` first (`WorkflowsPermissions.canEdit()`, refusal action `"manage workflows"` as the store and delete wrappers use), lists the models the editor can read (`ListModelsUseCase`, which filters by read access), keeps the bindable ones (`isBindableModel`, Task 7: not private, not tagged `$publishing:false`), filters by `search` (case-insensitive on `name` and `modelId`), sorts by name then `modelId`, pages with an offset cursor (base64 JSON `{ offset }`, `limit` default 20, max 100) and attaches the bound workflow `{ id, name } | null` per row from one `ListCmsEntryWorkflowsUseCase` call (one model per workflow, D15). An editor who can read no model gets an empty page. Every throw (permission load, model list) is `Workflows/Workflow/Persistence` (R87); an invalid cursor is `Workflows/Workflow/Validation`.

The test models are code models (`createModelPlugin`), registered in every context of the test through `legacyPlugins`, next to the default "author" model.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/modelListCursor.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/ListCmsEntryWorkflowModelsUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/index.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__cms/extraModels.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/listWorkflowModels.test.ts`

**Interfaces:**
- Consumes: `CurrentReviewViewer.getActor()`, `WorkflowsPermissions.canEdit()`, `ListModelsUseCase.execute({ includePrivate: false, includePlugins: true })` (fails with `Cms/Model/NotAuthorized` when the identity can read no model), `ListCmsEntryWorkflowsUseCase.execute(): Promise<Result<Workflow[], ListCmsEntryWorkflowsUseCase.Error>>` (phase 2), `isBindableModel` (Task 7), `toCmsNamespace` (`~/utils/appName.js`), `WorkflowsNotAuthorizedError`, `WorkflowValidationError`, `WorkflowPersistenceError`; test helpers `countEngineCalls` / `engineCalls`, `throwOnListModels` (Task 7), `failListWorkflows`, `throwOnWorkflowsPermissions`.
- Produces:
  - `ListCmsEntryWorkflowModelsUseCase.Interface.execute(input: ListCmsEntryWorkflowModelsInput): Promise<Result<ListCmsEntryWorkflowModelsResult, ListCmsEntryWorkflowModelsUseCase.Error>>`.
  - `ListCmsEntryWorkflowModelsInput { search?: string | null; limit?: number | null; after?: string | null }`.
  - `CmsEntryWorkflowModelWorkflow { id: string; name: string }`, `CmsEntryWorkflowModel { model: string; modelId: string; name: string; workflow: CmsEntryWorkflowModelWorkflow | null }` (`model` is the namespace, `cms.<modelId>`, the value a workflow's `models` holds), `CmsEntryWorkflowModelListMeta { cursor: string | null; hasMoreItems: boolean }`, `ListCmsEntryWorkflowModelsResult { items: CmsEntryWorkflowModel[]; meta: CmsEntryWorkflowModelListMeta }`.
  - Errors: `Workflows/NotAuthenticated`, `Workflows/NotAuthorized` (`{ action: "manage workflows" }`), `Workflows/Workflow/Validation` ("The model list cursor is not valid."), `Workflows/Workflow/Persistence`, plus `ListCmsEntryWorkflowsUseCase.Error`.
  - Pure: `encodeModelListCursor(cursor: ModelListCursor): string`, `decodeModelListCursor(value: string): ModelListCursor | null`, `ModelListCursor { offset: number }` (internal to the folder).
  - Test helper: `createExtraModelPlugins()` in `__tests__/__cms/extraModels.ts`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms-workflows/__tests__/__cms/extraModels.ts`:

```ts
import { createModelPlugin } from "@webiny/api-headless-cms";
import { model } from "./models.js";

/** The flags the variants set; `typeof model` has neither, so an annotated return would reject them. */
interface TestModelFlags {
    isPrivate?: boolean;
    tags?: string[];
}

type TestModel = typeof model & TestModelFlags;

/** A copy of the "author" model under another id and name. Pure. */
const createVariant = (modelId: string, name: string, pluralApiName: string): TestModel => {
    return { ...model, modelId, name, singularApiName: name.replace(/ /g, ""), pluralApiName };
};

/** Typed like `createModelsPlugins`' `modifyModel`, which the existing private-model tests use. */
const makePrivate = (input: TestModel): TestModel => {
    return { ...input, isPrivate: true };
};

const makeUnpublishable = (input: TestModel): TestModel => {
    return { ...input, tags: ["$publishing:false"] };
};

/**
 * Code models next to "author" for the editor model list: "article" and "book" are bindable,
 * "termEntry" ("Glossary") is bindable and matches a search only by its model id, "secretNote" is
 * private and "siteSetting" cannot be published.
 */
export const createExtraModelPlugins = () => {
    return [
        createModelPlugin(createVariant("article", "Article", "Articles")),
        createModelPlugin(createVariant("book", "Book", "Books")),
        createModelPlugin(createVariant("termEntry", "Glossary", "Glossaries")),
        createModelPlugin(makePrivate(createVariant("secretNote", "Secret Note", "SecretNotes"))),
        createModelPlugin(
            makeUnpublishable(createVariant("siteSetting", "Site Setting", "SiteSettings"))
        )
    ];
};
```

Create `packages/api-headless-cms-workflows/__tests__/wrappers/listWorkflowModels.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { EDITOR, READER } from "~tests/__helpers/identities.js";
import { CMS_READER, WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { throwOnListModels } from "~tests/__helpers/ThrowingListModels.js";
import { failListWorkflows } from "~tests/__helpers/FailingListWorkflows.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { ListCmsEntryWorkflowModelsUseCase } from "~/features/wrappers/ListCmsEntryWorkflowModels/index.js";

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];

/** A context with the extra code models; counts the engine's calls. */
const createModelsContext = (params: UserContextParams = {}) => {
    return createUserContext({
        ...params,
        legacyPlugins: [...createExtraModelPlugins(), countEngineCalls, ...(params.legacyPlugins ?? [])]
    });
};

/** Admin binds "Test Workflow" to "author" and "Books review" to "book". */
const createScenario = async () => {
    const admin = await createModelsContext();
    expectOk(await storeWorkflow(admin));
    expectOk(
        await storeWorkflow(admin, {
            ...createWorkflowValues(["cms.book"]),
            id: "workflow-2",
            name: "Books review"
        })
    );
};

const listModels = (context: CmsContext, input: ListCmsEntryWorkflowModelsUseCase.Input = {}) => {
    return context.container.resolve(ListCmsEntryWorkflowModelsUseCase).execute(input);
};

describe("CMS editor model list wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    it("lists the bindable models sorted by name with the bound workflow (D116)", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS
        });

        const page = expectOk(await listModels(editor));

        expect(page.items).toEqual([
            { model: "cms.article", modelId: "article", name: "Article", workflow: null },
            {
                model: "cms.author",
                modelId: "author",
                name: "Author",
                workflow: { id: "workflow-1", name: "Test Workflow" }
            },
            {
                model: "cms.book",
                modelId: "book",
                name: "Book",
                workflow: { id: "workflow-2", name: "Books review" }
            },
            { model: "cms.termEntry", modelId: "termEntry", name: "Glossary", workflow: null }
        ]);
        expect(page.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("searches the name and the model id, ignoring case", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS
        });

        const byName = expectOk(await listModels(editor, { search: "AUTH" }));
        const byModelId = expectOk(await listModels(editor, { search: "termentry" }));
        const nothing = expectOk(await listModels(editor, { search: "secret" }));

        expect(byName.items.map(row => row.modelId)).toEqual(["author"]);
        expect(byModelId.items.map(row => row.modelId)).toEqual(["termEntry"]);
        expect(nothing.items).toEqual([]);
    });

    it("pages with the cursor", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS
        });

        const first = expectOk(await listModels(editor, { limit: 3 }));
        const second = expectOk(await listModels(editor, { limit: 3, after: first.meta.cursor }));

        expect(first.items.map(row => row.modelId)).toEqual(["article", "author", "book"]);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(first.meta.cursor).toEqual(expect.any(String));
        expect(second.items.map(row => row.modelId)).toEqual(["termEntry"]);
        expect(second.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("rejects a cursor it did not issue", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS
        });

        const garbage = await listModels(editor, { after: "not-a-cursor" });
        const negative = await listModels(editor, {
            after: Buffer.from(JSON.stringify({ offset: -1 })).toString("base64")
        });

        expect(garbage.error.code).toBe("Workflows/Workflow/Validation");
        expect(garbage.error.message).toBe("The model list cursor is not valid.");
        expect(negative.error.code).toBe("Workflows/Workflow/Validation");
    });

    it("returns an empty page for an editor who can read no model", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR]
        });

        const page = expectOk(await listModels(editor));

        expect(page).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
    });

    it("refuses a user without editor, before the engine", async () => {
        await createScenario();
        const reader = await createModelsContext({ identity: READER, permissions: CMS_READER });
        engineCalls.length = 0;

        const result = await listModels(reader);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "manage workflows" });
        expect(engineCalls).toEqual([]);
    });

    it("refuses an anonymous identity, before the engine", async () => {
        await createScenario();
        const anonymous = await createModelsContext({ identity: null, permissions: [] });
        engineCalls.length = 0;

        const result = await listModels(anonymous);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when a dependency throws or fails (R87)", async () => {
        await createScenario();
        const permissionsThrow = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [throwOnWorkflowsPermissions]
        });
        const modelsThrow = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [throwOnListModels]
        });
        const workflowsFail = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [failListWorkflows]
        });

        const permissionsResult = await listModels(permissionsThrow);
        const modelsResult = await listModels(modelsThrow);
        const workflowsResult = await listModels(workflowsFail);

        expect(permissionsResult.error.code).toBe("Workflows/Workflow/Persistence");
        expect(modelsResult.error.code).toBe("Workflows/Workflow/Persistence");
        expect(workflowsResult.error.code).toBe("Workflows/Workflow/Persistence");
    });
});
```

In `packages/api-headless-cms-workflows/__tests__/registration.test.ts`, add the import after the `ListCmsEntryReviewsUseCase` import (Task 7):

```ts
import { ListCmsEntryWorkflowModelsUseCase } from "~/features/wrappers/ListCmsEntryWorkflowModels/index.js";
```

and add `ListCmsEntryWorkflowModelsUseCase,` to `WRAPPERS` after `GetCmsEntryWorkflowUseCase,`.

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/listWorkflowModels.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/ListCmsEntryWorkflowModels/index.js`.

- [ ] **Step 3: The cursor**

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/modelListCursor.ts`:

```ts
/** Where the next page of the editor model list starts (R99). */
export interface ModelListCursor {
    offset: number;
}

interface ParsedModelListCursor {
    offset?: unknown;
}

/** Opaque: base64 of JSON `{ offset }`. Pure. */
export const encodeModelListCursor = (cursor: ModelListCursor): string => {
    return Buffer.from(JSON.stringify({ offset: cursor.offset })).toString("base64");
};

/** `null` for anything `encodeModelListCursor` does not produce. Pure. */
export const decodeModelListCursor = (value: string): ModelListCursor | null => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    } catch {
        return null;
    }
    if (typeof parsed !== "object" || parsed === null) {
        return null;
    }
    const offset = (parsed as ParsedModelListCursor).offset;
    if (typeof offset !== "number" || !Number.isInteger(offset) || offset < 0) {
        return null;
    }
    return { offset };
};
```

- [ ] **Step 4: ListCmsEntryWorkflowModels**

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import type { ListCmsEntryWorkflowsUseCase } from "../ListCmsEntryWorkflows/index.js";

export interface ListCmsEntryWorkflowModelsInput {
    /** Case-insensitive, on the model name and the model id. */
    search?: string | null;
    /** Default 20, max 100. */
    limit?: number | null;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface CmsEntryWorkflowModelWorkflow {
    id: string;
    name: string;
}

export interface CmsEntryWorkflowModel {
    /** Namespace id, `cms.<modelId>`, as a workflow's `models` holds it. */
    model: string;
    modelId: string;
    name: string;
    /** The workflow bound to the model (one model per workflow, D15). */
    workflow: CmsEntryWorkflowModelWorkflow | null;
}

export interface CmsEntryWorkflowModelListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
}

export interface ListCmsEntryWorkflowModelsResult {
    items: CmsEntryWorkflowModel[];
    meta: CmsEntryWorkflowModelListMeta;
}

export interface IListCmsEntryWorkflowModelsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    validation: WorkflowValidationError;
    persistence: WorkflowPersistenceError;
    workflows: ListCmsEntryWorkflowsUseCase.Error;
}

type UseCaseError =
    IListCmsEntryWorkflowModelsUseCaseErrors[keyof IListCmsEntryWorkflowModelsUseCaseErrors];

export interface IListCmsEntryWorkflowModelsUseCase {
    execute(
        input: ListCmsEntryWorkflowModelsInput
    ): Promise<Result<ListCmsEntryWorkflowModelsResult, UseCaseError>>;
}

/**
 * The models the workflow editor can bind, one page at a time (D116, R99): needs `editor`; only
 * readable, public, publishable models; each row names its bound workflow.
 */
export const ListCmsEntryWorkflowModelsUseCase =
    createAbstraction<IListCmsEntryWorkflowModelsUseCase>("ListCmsEntryWorkflowModelsUseCase");

export namespace ListCmsEntryWorkflowModelsUseCase {
    export type Interface = IListCmsEntryWorkflowModelsUseCase;
    export type Input = ListCmsEntryWorkflowModelsInput;
    export type Row = CmsEntryWorkflowModel;
    export type Value = ListCmsEntryWorkflowModelsResult;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListCmsEntryWorkflowModelsResult, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/ListCmsEntryWorkflowModelsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { toCmsNamespace } from "~/utils/appName.js";
import { isBindableModel } from "~/utils/isBindableModel.js";
import { ListCmsEntryWorkflowsUseCase } from "../ListCmsEntryWorkflows/index.js";
import type { CmsEntryWorkflowModelWorkflow } from "./abstractions.js";
import { ListCmsEntryWorkflowModelsUseCase as UseCase } from "./abstractions.js";
import { decodeModelListCursor, encodeModelListCursor } from "./modelListCursor.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** `ListModelsUseCase` fails with this when the identity can read no model at all. */
const MODEL_NOT_AUTHORIZED = "Cms/Model/NotAuthorized";

/** By name, then by model id, so equal names keep a stable order. Pure. */
const compareModels = (a: CmsModel, b: CmsModel): number => {
    return a.name.localeCompare(b.name) || a.modelId.localeCompare(b.modelId);
};

class ListCmsEntryWorkflowModelsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private listModels: ListModelsUseCase.Interface,
        private listWorkflows: ListCmsEntryWorkflowsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "manage workflows" }));
        }

        const cursor = input.after ? decodeModelListCursor(input.after) : { offset: 0 };
        if (!cursor) {
            return Result.fail(new WorkflowValidationError("The model list cursor is not valid."));
        }

        let models: Awaited<ListModelsUseCase.Return>;
        try {
            models = await this.listModels.execute({ includePrivate: false, includePlugins: true });
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (models.isFail() && models.error.code !== MODEL_NOT_AUTHORIZED) {
            return Result.fail(new WorkflowPersistenceError(models.error));
        }

        const search = (input.search ?? "").trim().toLowerCase();
        const matching = (models.isOk() ? models.value : [])
            .filter(model => isBindableModel(model))
            .filter(model => {
                if (!search) {
                    return true;
                }
                return (
                    model.name.toLowerCase().includes(search) ||
                    model.modelId.toLowerCase().includes(search)
                );
            })
            .sort(compareModels);
        const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
        const page = matching.slice(cursor.offset, cursor.offset + limit);
        const nextOffset = cursor.offset + page.length;
        const hasMoreItems = nextOffset < matching.length;

        // One list for every row; v1 binds one model per workflow (D15).
        const workflows = await this.listWorkflows.execute();
        if (workflows.isFail()) {
            return Result.fail(workflows.error);
        }
        const bound = new Map<string, CmsEntryWorkflowModelWorkflow>();
        for (const workflow of workflows.value) {
            for (const namespace of workflow.models) {
                bound.set(namespace, { id: workflow.id, name: workflow.name });
            }
        }

        return Result.ok({
            items: page.map(model => {
                const namespace = toCmsNamespace(model.modelId);
                return {
                    model: namespace,
                    modelId: model.modelId,
                    name: model.name,
                    workflow: bound.get(namespace) ?? null
                };
            }),
            meta: {
                cursor: hasMoreItems ? encodeModelListCursor({ offset: nextOffset }) : null,
                hasMoreItems
            }
        });
    }
}

export const ListCmsEntryWorkflowModelsUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryWorkflowModelsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        ListModelsUseCase,
        ListCmsEntryWorkflowsUseCase
    ]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryWorkflowModelsUseCase } from "./ListCmsEntryWorkflowModelsUseCase.js";

export const ListCmsEntryWorkflowModelsFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryWorkflowModels",
    register(container) {
        container.register(ListCmsEntryWorkflowModelsUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/index.ts`:

```ts
export { ListCmsEntryWorkflowModelsUseCase } from "./abstractions.js";
export type {
    CmsEntryWorkflowModel,
    CmsEntryWorkflowModelWorkflow,
    ListCmsEntryWorkflowModelsInput,
    ListCmsEntryWorkflowModelsResult
} from "./abstractions.js";
```

- [ ] **Step 5: Register**

In `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`, add the import after the `GetCmsEntryWorkflowFeature` import:

```ts
import { ListCmsEntryWorkflowModelsFeature } from "./ListCmsEntryWorkflowModels/feature.js";
```

and register it in the `// Workflows` block after `GetCmsEntryWorkflowFeature.register(container);`:

```ts
        ListCmsEntryWorkflowModelsFeature.register(container);
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS, or "not run" (A9).

Run: `yarn check:test:types 2>&1 | grep -iE "api-headless-cms-workflows" | head`
Expected: no output.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-headless-cms-workflows): add the editor model list wrapper

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
