### Task 31: CMS gateways throw `GraphQLOperationError` (`app-headless-cms`)

R204, R228 (A72); user answer Q3; Review Focus 9. The warning flow (Tasks 33-35) is driven by the server refusal `Workflows/Review/ActiveReviewOnTrash`. Today the four CMS delete and bulk gateways flatten every envelope error into `new Error(message)`, so `code` and `data` (the blocking reviews) are lost before any presenter or decorator sees them. This task makes the four gateways throw the typed error from Task 6 and changes nothing else: each gateway keeps its own throw condition, its message fallback, its variables and its success value. Non-workflow errors keep their message, so every existing caller that shows `error.message` behaves as before.

- **Where:** only the throw site of each gateway. The four documents already select `error { message code data }` (verified: `DeleteEntryGateway`, `DeleteEntryRevisionGateway`, `PermanentlyDeleteEntryGateway` use `error { message code data }`, `BulkActionGateway` selects `error { message code data }` over three lines), so no document changes.
- **Throw conditions kept:** `DeleteEntryGateway` and `DeleteEntryRevisionGateway` throw when `error` is set; `PermanentlyDeleteEntryGateway` and `BulkActionGateway` throw when `data` is falsy (their messages come from `error?.message`).
- **Fallbacks kept:** "Could not delete entry", "Could not delete entry revision", "Could not permanently delete the entry.", "Bulk action failed". A falsy `error.message` falls back to the same text as today (`||`). When there is no `error` at all the typed error carries `code` and `data` as `null` (Task 6 defaults).
- **Transport errors** (a rejected `client.execute`) pass through untouched.
- **A72 (bulk as background task), recorded here and in the commit:** `BulkActionsGraphQLSchema` (`packages/api-headless-cms-bulk-actions/src/graphql/BulkActionsGraphQLSchema.ts`) resolves `bulkAction<Model>` by calling `TriggerTaskUseCase` and returns `new Response({ id: response.value.id })` (a `BulkActionResponse { data { id }, error }`). The per-entry work runs later in the background task, so per-entry refusals never reach the GraphQL response. Consequences for R228: the typed error from `BulkActionGateway` appears only when the mutation itself is refused; the "all selected" path has no pre-warning (documented in Task 38); Task 35 changes nothing for it. The `BulkActionGateway` test below pins the response shape (`data` is only `{ id }`).

**Files:**
- Modify: `packages/app-headless-cms/src/features/contentEntry/deleteEntry/DeleteEntryGateway.ts`
- Modify: `packages/app-headless-cms/src/features/contentEntry/deleteEntryRevision/DeleteEntryRevisionGateway.ts`
- Modify: `packages/app-headless-cms/src/features/contentEntry/permanentlyDeleteEntry/PermanentlyDeleteEntryGateway.ts`
- Modify: `packages/app-headless-cms/src/features/contentEntry/bulkAction/BulkActionGateway.ts`
- Create: `packages/app-headless-cms/src/features/contentEntry/deleteEntry/DeleteEntryGateway.test.ts`
- Create: `packages/app-headless-cms/src/features/contentEntry/deleteEntryRevision/DeleteEntryRevisionGateway.test.ts`
- Create: `packages/app-headless-cms/src/features/contentEntry/permanentlyDeleteEntry/PermanentlyDeleteEntryGateway.test.ts`
- Create: `packages/app-headless-cms/src/features/contentEntry/bulkAction/BulkActionGateway.test.ts`

**Interfaces:**
- Consumes:
  - Task 6: `GraphQLOperationError` (`@webiny/app/errors/index.js`; `new GraphQLOperationError({ message, code?, data? })`, `readonly code: string | null`, `readonly data: unknown`). `yarn build -p @webiny/app --no-cache 2>&1 | tail -30` must have run after Task 6.
  - Existing: `CmsGraphQLClient` (`~/features/graphQLClient/abstractions.js`), `CmsErrorResponse { message: string; code: string; data?: Record<string, any> | null }` and `CmsModel` (`~/types.js`), each gateway's abstraction in its `abstractions.ts`.
- Produces (consumed by Task 35 and by every presenter that shows these errors):
  - The four gateways throw `new GraphQLOperationError({ message: error.message || "<existing fallback>", code: error.code, data: error.data })` under their existing condition.
  - The A72 finding above, in the commit message (consumed by Task 35).

- [ ] **Step 1: Write the failing tests**

All four test files use the same setup: a `Container` with a fake `CmsGraphQLClient` (`execute` is a `vi.fn()`), the gateway registered and resolved through its abstraction. Admin tests in this package run in the existing vitest config (`packages/app-headless-cms/vitest.config.ts`, no DOM needed).

Create `packages/app-headless-cms/src/features/contentEntry/deleteEntry/DeleteEntryGateway.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel } from "~/types.js";
import { DeleteEntryGateway as GatewayAbstraction } from "./abstractions.js";
import { DeleteEntryGateway } from "./DeleteEntryGateway.js";

const model = { modelId: "article", singularApiName: "Article" } as CmsModel;

const blockedData = {
    model: "cms.article",
    action: "trash",
    reviews: [
        {
            reviewId: "review-1",
            model: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Launch article",
            stepPosition: 2,
            stepCount: 3,
            stepName: "Legal"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(CmsGraphQLClient, client);
    container.register(DeleteEntryGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("DeleteEntryGateway", () => {
    it("returns true and sends the entry id as the trash revision", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: true, error: null } });

        const result = await gateway.execute({ model, id: "entry-1#0001" });

        expect(result).toBe(true);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ revision: "entry-1#0001", permanently: false });
        expect(request.query).toContain("error { message code data }");
    });

    it("throws a GraphQLOperationError carrying the code, data and message of the envelope error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: {
                data: null,
                error: {
                    message: "This content has a review in progress. Trashing it cancels the review.",
                    code: "Workflows/Review/ActiveReviewOnTrash",
                    data: blockedData
                }
            }
        });

        const error = await gateway.execute({ model, id: "entry-1#0001" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe(
            "This content has a review in progress. Trashing it cancels the review."
        );
        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data).toEqual(blockedData);
    });

    it("falls back to the existing message when the server sends none", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: { data: null, error: { message: "", code: "Some/Code", data: null } }
        });

        const error = await gateway.execute({ model, id: "entry-1#0001" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not delete entry");
        expect(error.code).toBe("Some/Code");
        expect(error.data).toBeNull();
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute({ model, id: "entry-1#0001" }).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
```

Create `packages/app-headless-cms/src/features/contentEntry/deleteEntryRevision/DeleteEntryRevisionGateway.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel } from "~/types.js";
import { DeleteEntryRevisionGateway as GatewayAbstraction } from "./abstractions.js";
import { DeleteEntryRevisionGateway } from "./DeleteEntryRevisionGateway.js";

const model = { modelId: "article", singularApiName: "Article" } as CmsModel;

const blockedData = {
    model: "cms.article",
    action: "delete",
    reviews: [
        {
            reviewId: "review-1",
            model: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            title: "Launch article",
            stepPosition: 1,
            stepCount: 2,
            stepName: "Editor"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(CmsGraphQLClient, client);
    container.register(DeleteEntryRevisionGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("DeleteEntryRevisionGateway", () => {
    it("returns true and sends only the revision id", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: true, error: null } });

        const result = await gateway.execute({ model, revisionId: "entry-1#0002" });

        expect(result).toBe(true);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ revision: "entry-1#0002" });
        expect(request.query).toContain("error { message code data }");
    });

    it("throws a GraphQLOperationError carrying the code, data and message of the envelope error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: {
                data: null,
                error: {
                    message: "This content has a review in progress. Deleting it cancels the review.",
                    code: "Workflows/Review/ActiveReviewOnTrash",
                    data: blockedData
                }
            }
        });

        const error = await gateway
            .execute({ model, revisionId: "entry-1#0002" })
            .catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe(
            "This content has a review in progress. Deleting it cancels the review."
        );
        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data).toEqual(blockedData);
    });

    it("falls back to the existing message when the server sends none", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: { data: null, error: { message: "", code: "Some/Code", data: null } }
        });

        const error = await gateway
            .execute({ model, revisionId: "entry-1#0002" })
            .catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not delete entry revision");
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway
            .execute({ model, revisionId: "entry-1#0002" })
            .catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
```

Create `packages/app-headless-cms/src/features/contentEntry/permanentlyDeleteEntry/PermanentlyDeleteEntryGateway.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel } from "~/types.js";
import { PermanentlyDeleteEntryGateway as GatewayAbstraction } from "./abstractions.js";
import { PermanentlyDeleteEntryGateway } from "./PermanentlyDeleteEntryGateway.js";

const model = { modelId: "article", singularApiName: "Article" } as CmsModel;

const blockedData = {
    model: "cms.article",
    action: "delete",
    reviews: [
        {
            reviewId: "review-1",
            model: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Launch article",
            stepPosition: 1,
            stepCount: 1,
            stepName: "Editor"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(CmsGraphQLClient, client);
    container.register(PermanentlyDeleteEntryGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("PermanentlyDeleteEntryGateway", () => {
    it("returns true and sends permanently: true", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: true, error: null } });

        const result = await gateway.execute({ model, id: "entry-1" });

        expect(result).toBe(true);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ revision: "entry-1", permanently: true });
        expect(request.query).toContain("error { message code data }");
    });

    it("throws a GraphQLOperationError carrying the code, data and message when data is falsy", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: {
                data: null,
                error: {
                    message: "This content has a review in progress. Deleting it cancels the review.",
                    code: "Workflows/Review/ActiveReviewOnTrash",
                    data: blockedData
                }
            }
        });

        const error = await gateway.execute({ model, id: "entry-1" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe(
            "This content has a review in progress. Deleting it cancels the review."
        );
        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data).toEqual(blockedData);
    });

    it("keeps its condition: a falsy data with no error throws the fallback with a null code and data", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: false, error: null } });

        const error = await gateway.execute({ model, id: "entry-1" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not permanently delete the entry.");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("falls back to the existing message when the server sends an empty one", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: { data: null, error: { message: "", code: "Some/Code", data: null } }
        });

        const error = await gateway.execute({ model, id: "entry-1" }).catch(e => e);

        expect(error.message).toBe("Could not permanently delete the entry.");
        expect(error.code).toBe("Some/Code");
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute({ model, id: "entry-1" }).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
```

Create `packages/app-headless-cms/src/features/contentEntry/bulkAction/BulkActionGateway.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel } from "~/types.js";
import { BulkActionGateway as GatewayAbstraction } from "./abstractions.js";
import { BulkActionGateway } from "./BulkActionGateway.js";

const model = { modelId: "article", singularApiName: "Article" } as CmsModel;

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(CmsGraphQLClient, client);
    container.register(BulkActionGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("BulkActionGateway", () => {
    it("returns the background task id and sends the action arguments unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: { id: "task-1" }, error: null } });

        const result = await gateway.execute({
            model,
            action: "MoveToTrash",
            where: { id_in: ["entry-1#0001"] }
        });

        expect(result).toEqual({ id: "task-1" });
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            action: "MoveToTrash",
            where: { id_in: ["entry-1#0001"] },
            search: undefined,
            data: undefined
        });
        expect(request.query).toMatch(/error\s*\{\s*message\s*code\s*data\s*\}/);
    });

    it("A72: the response carries only the task id, no per-entry failures", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: { id: "task-1" }, error: null } });

        const result = await gateway.execute({ model, action: "MoveToTrash" });

        expect(Object.keys(result)).toEqual(["id"]);
        const request = client.execute.mock.calls[0][0];
        expect(request.query).toMatch(/data\s*\{\s*id\s*\}/);
    });

    it("throws a GraphQLOperationError carrying the code, data and message when the mutation is refused", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: {
                data: null,
                error: {
                    message: "Not authorized.",
                    code: "Workflows/NotAuthorized",
                    data: { reason: "denied" }
                }
            }
        });

        const error = await gateway.execute({ model, action: "MoveToTrash" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Not authorized.");
        expect(error.code).toBe("Workflows/NotAuthorized");
        expect(error.data).toEqual({ reason: "denied" });
    });

    it("keeps its condition: no data and no error throws the fallback with a null code and data", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: null, error: null } });

        const error = await gateway.execute({ model, action: "MoveToTrash" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Bulk action failed");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute({ model, action: "MoveToTrash" }).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

Admin package: `yarn test <path>` only (the storage legs `yarn test:os` apply to the API packages of 8a.1, not to admin code).

```bash
yarn build -p @webiny/app --no-cache 2>&1 | tail -30
yarn test packages/app-headless-cms/src/features/contentEntry/deleteEntry/DeleteEntryGateway.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/features/contentEntry/deleteEntryRevision/DeleteEntryRevisionGateway.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/features/contentEntry/permanentlyDeleteEntry/PermanentlyDeleteEntryGateway.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/features/contentEntry/bulkAction/BulkActionGateway.test.ts 2>&1 | tail -50
```

Expected: FAIL. In each file the "throws a GraphQLOperationError ..." and "falls back ..." cases fail with `expected Error to be an instance of GraphQLOperationError` (today the gateways throw a plain `Error`); the success, transport and variables cases already pass. Record the RED output.

- [ ] **Step 3: Implement**

In each of the four gateways add one import and replace the one `throw`. Nothing else in these files changes.

`packages/app-headless-cms/src/features/contentEntry/deleteEntry/DeleteEntryGateway.ts`:

```ts
// Before (top of the file):
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";

// After:
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
```

```ts
// Before:
        if (error) {
            throw new Error(error.message || "Could not delete entry");
        }

// After:
        if (error) {
            throw new GraphQLOperationError({
                message: error.message || "Could not delete entry",
                code: error.code,
                data: error.data
            });
        }
```

`packages/app-headless-cms/src/features/contentEntry/deleteEntryRevision/DeleteEntryRevisionGateway.ts`:

```ts
// Before (top of the file):
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";

// After:
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
```

```ts
// Before:
        if (error) {
            throw new Error(error.message || "Could not delete entry revision");
        }

// After:
        if (error) {
            throw new GraphQLOperationError({
                message: error.message || "Could not delete entry revision",
                code: error.code,
                data: error.data
            });
        }
```

`packages/app-headless-cms/src/features/contentEntry/permanentlyDeleteEntry/PermanentlyDeleteEntryGateway.ts`:

```ts
// Before (top of the file):
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";

// After:
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
```

```ts
// Before:
        if (!data) {
            throw new Error(error?.message || "Could not permanently delete the entry.");
        }

// After:
        if (!data) {
            throw new GraphQLOperationError({
                message: error?.message || "Could not permanently delete the entry.",
                code: error?.code,
                data: error?.data
            });
        }
```

`packages/app-headless-cms/src/features/contentEntry/bulkAction/BulkActionGateway.ts`:

```ts
// Before (top of the file):
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";

// After:
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
```

```ts
// Before:
        if (!result) {
            throw new Error(error?.message || "Bulk action failed");
        }

// After:
        if (!result) {
            throw new GraphQLOperationError({
                message: error?.message || "Bulk action failed",
                code: error?.code,
                data: error?.data
            });
        }
```

`@webiny/app` is already a dependency of `packages/app-headless-cms` (`"@webiny/app": "0.0.0"`), so no `package.json` change; `yarn adio` in Step 6 confirms.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-headless-cms/src/features/contentEntry/deleteEntry/DeleteEntryGateway.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/features/contentEntry/deleteEntryRevision/DeleteEntryRevisionGateway.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/features/contentEntry/permanentlyDeleteEntry/PermanentlyDeleteEntryGateway.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/features/contentEntry/bulkAction/BulkActionGateway.test.ts 2>&1 | tail -50
```

Expected: PASS (4 files).

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-headless-cms/src/presentation/contentEntries/list/ContentEntriesPresenter.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-headless-cms --no-cache 2>&1 | tail -30
```

Expected: PASS and no type errors. (`app-headless-cms` has no `__tests__/**/*.test.ts`, so `check:test:types` does not list it; the build type-checks the co-located tests, R243. `ContentEntriesPresenter.test.ts` runs `DeleteEntryFeature` with a faked gateway, so it proves the repository and use case chain is unchanged.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-headless-cms --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-headless-cms): throw GraphQLOperationError from the delete and bulk gateways" -m "The four delete and bulk gateways keep their throw condition and message fallback and now carry the envelope code and data, so the workflows warning can read ActiveReviewOnTrash. A72: bulkAction<Model> only triggers a background task and returns its id, so per-entry refusals never reach the response and the all-selected path has no pre-warning." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

**Contract notes:**
- Unverified: whether `yarn test` for this package resolves `@webiny/app/errors/index.js` from `src` or from `dist`. Step 2 builds `@webiny/app` first so both work; if it still fails to resolve, check `packages/app-headless-cms/tsconfig.json` `paths` for `@webiny/app/*`.
