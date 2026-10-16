### Task 32: WB gateways throw `GraphQLOperationError` (`app-website-builder`)

R204, R228 (A72), R235; user answers Q3, Q14; Review Focus 9. Same change as Task 31 for the four Website Builder delete gateways: each keeps its throw condition, message fallback, variables and success value, and throws the typed error from Task 6 carrying `code` and `data`, so the workflows decorators (Task 36) can read `ActiveReviewOnTrash`. Three gateway-specific details:

- **`DeletePageRevisionGateway`** calls the `deletePageRevision(id: ID!)` mutation that Task 3 adds to the API. It also sends an undeclared `permanently` variable today (the document declares only `$id`, and the server mutation has no such argument). This task drops it: the gateway sends `{ id }` only. The abstraction (`execute(id, permanently)`) and the repository are unchanged; the gateway simply ignores the second argument.
- **The two trash-bin gateways** (`WbTrashBinDeleteGateway`, `WbTrashBinBulkActionGateway`) do not select `data` on `error` today. They add it to the document and to the response type. `WbTrashBinBulkActionGateway` keeps its condition `if (error || !data)`.
- **A72 for the WB bulk mutation, recorded here and in the commit:** `packages/api-website-builder*` define no `bulkActions` field and no `WbBulkActionsInput` (`grep -rn "bulkActions\|WbBulkActionsInput" packages/api-website-builder*/src` finds nothing; the only occurrence is the admin `WbTrashBinBulkActionGateway` document). The trash-bin "bulk" operations of the shared `TrashBinPresenter` therefore have no server operation to refuse or fail per page, and the WB list "Delete" bulk action (`BulkDeletePresenter`, `packages/app-website-builder/src/presentation/pages/bulkActions/BulkDeletePresenter.ts`) already runs one `DeletePageUseCase` call per page in series. So for WB the R228 collect flow covers the whole bulk delete and no background-task path exists. The typed error in `WbTrashBinBulkActionGateway` is still correct for a schema or authorization refusal.

**Files:**
- Modify: `packages/app-website-builder/src/features/pages/deletePage/DeletePageGateway.ts`
- Modify: `packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionGateway.ts`
- Modify: `packages/app-website-builder/src/features/pages/trashBin/WbTrashBinDeleteGateway.ts`
- Modify: `packages/app-website-builder/src/features/pages/trashBin/WbTrashBinBulkActionGateway.ts`
- Create: `packages/app-website-builder/src/features/pages/deletePage/DeletePageGateway.test.ts`
- Create: `packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionGateway.test.ts`
- Create: `packages/app-website-builder/src/features/pages/trashBin/WbTrashBinDeleteGateway.test.ts`
- Create: `packages/app-website-builder/src/features/pages/trashBin/WbTrashBinBulkActionGateway.test.ts`

**Interfaces:**
- Consumes:
  - Task 6: `GraphQLOperationError` (`@webiny/app/errors/index.js`), built before this task (`yarn build -p @webiny/app --no-cache 2>&1 | tail -30`).
  - Task 3: the `deletePageRevision(id: ID!): WbBooleanResponse` mutation (the gateway document already matches it).
  - Existing: `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient`), `DeletePageGateway` and `DeletePageRevisionGateway` abstractions (`./abstractions.js` of each folder), `TrashBinDeleteGateway` and `TrashBinBulkActionGateway` abstractions (`@webiny/app-admin/presentation/trashBin/abstractions.js`).
- Produces (consumed by Task 36 and by every caller that shows these errors):
  - The four gateways throw `new GraphQLOperationError({ message: <envelope message> || "<existing fallback>", code, data })` under their existing condition.
  - `DeletePageRevisionGateway` sends `{ id }` only.
  - The A72 finding above, in the commit message (consumed by Task 36).

- [ ] **Step 1: Write the failing tests**

All four files use a `Container` with a fake `MainGraphQLClient` (`execute` is a `vi.fn()`), the gateway registered and resolved through its abstraction. The package's vitest config runs in jsdom; the gateways need no DOM. Admin tests run with `yarn test <path>` only (storage legs are for the API packages of 8a.1).

Create `packages/app-website-builder/src/features/pages/deletePage/DeletePageGateway.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { DeletePageGateway as GatewayAbstraction } from "./abstractions.js";
import { DeletePageGateway } from "./DeletePageGateway.js";

const blockedData = {
    model: "wb.page",
    action: "trash",
    reviews: [
        {
            reviewId: "review-1",
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            title: "Home page",
            stepPosition: 1,
            stepCount: 2,
            stepName: "Editor"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.register(DeletePageGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("DeletePageGateway", () => {
    it("resolves when the envelope has no error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: { deletePage: { data: true, error: null } }
        });

        await expect(gateway.execute("page-1#0001", false)).resolves.toBeUndefined();

        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ id: "page-1#0001", permanently: false });
        expect(request.query).toMatch(/error\s*\{\s*code\s*data\s*message\s*\}/);
    });

    it("throws a GraphQLOperationError carrying the code, data and message of the envelope error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: {
                deletePage: {
                    data: null,
                    error: {
                        message:
                            "This content has a review in progress. Trashing it cancels the review.",
                        code: "Workflows/Review/ActiveReviewOnTrash",
                        data: blockedData
                    }
                }
            }
        });

        const error = await gateway.execute("page-1#0001", false).catch(e => e);

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
            websiteBuilder: {
                deletePage: { data: null, error: { message: "", code: "Some/Code", data: null } }
            }
        });

        const error = await gateway.execute("page-1#0001", false).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not delete page.");
        expect(error.code).toBe("Some/Code");
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute("page-1#0001", false).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
```

Create `packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionGateway.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { DeletePageRevisionGateway as GatewayAbstraction } from "./abstractions.js";
import { DeletePageRevisionGateway } from "./DeletePageRevisionGateway.js";

const blockedData = {
    model: "wb.page",
    action: "delete",
    reviews: [
        {
            reviewId: "review-1",
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0002",
            title: "Home page",
            stepPosition: 2,
            stepCount: 2,
            stepName: "Legal"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.register(DeletePageRevisionGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("DeletePageRevisionGateway", () => {
    it("resolves and sends only the revision id (no undeclared permanently variable)", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: { deletePageRevision: { data: true, error: null } }
        });

        await expect(gateway.execute("page-1#0002", true)).resolves.toBeUndefined();

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ id: "page-1#0002" });
        expect(request.query).toContain("deletePageRevision(id: $id)");
    });

    it("throws a GraphQLOperationError carrying the code, data and message of the envelope error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: {
                deletePageRevision: {
                    data: null,
                    error: {
                        message:
                            "This content has a review in progress. Deleting it cancels the review.",
                        code: "Workflows/Review/ActiveReviewOnTrash",
                        data: blockedData
                    }
                }
            }
        });

        const error = await gateway.execute("page-1#0002", true).catch(e => e);

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
            websiteBuilder: {
                deletePageRevision: {
                    data: null,
                    error: { message: "", code: "Some/Code", data: null }
                }
            }
        });

        const error = await gateway.execute("page-1#0002", true).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not delete page revision.");
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute("page-1#0002", true).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
```

Create `packages/app-website-builder/src/features/pages/trashBin/WbTrashBinDeleteGateway.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { TrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { WbTrashBinDeleteGateway } from "./WbTrashBinDeleteGateway.js";

const blockedData = {
    model: "wb.page",
    action: "delete",
    reviews: [
        {
            reviewId: "review-1",
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            title: "Home page",
            stepPosition: 1,
            stepCount: 1,
            stepName: "Editor"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.register(WbTrashBinDeleteGateway).inSingletonScope();
    const gateway = container.resolve(TrashBinDeleteGateway);
    return { client, gateway };
}

describe("WbTrashBinDeleteGateway", () => {
    it("returns true, sends permanently: true and selects the error data", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: { deletePage: { data: true, error: null } }
        });

        const result = await gateway.execute("page-1#0001");

        expect(result).toBe(true);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ id: "page-1#0001", permanently: true });
        expect(request.query).toMatch(/error\s*\{\s*code\s*message\s*data\s*\}/);
    });

    it("throws a GraphQLOperationError carrying the code, data and message of the envelope error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: {
                deletePage: {
                    data: null,
                    error: {
                        message:
                            "This content has a review in progress. Deleting it cancels the review.",
                        code: "Workflows/Review/ActiveReviewOnTrash",
                        data: blockedData
                    }
                }
            }
        });

        const error = await gateway.execute("page-1#0001").catch(e => e);

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
            websiteBuilder: {
                deletePage: { data: null, error: { code: "Some/Code", message: "" } }
            }
        });

        const error = await gateway.execute("page-1#0001").catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not permanently delete the page.");
        expect(error.code).toBe("Some/Code");
        expect(error.data).toBeNull();
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute("page-1#0001").catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
```

Create `packages/app-website-builder/src/features/pages/trashBin/WbTrashBinBulkActionGateway.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { TrashBinBulkActionGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { WbTrashBinBulkActionGateway } from "./WbTrashBinBulkActionGateway.js";

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.register(WbTrashBinBulkActionGateway).inSingletonScope();
    const gateway = container.resolve(TrashBinBulkActionGateway);
    return { client, gateway };
}

describe("WbTrashBinBulkActionGateway", () => {
    it("returns the data and sends the action unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: { bulkActions: { data: { id: "task-1" }, error: null } }
        });

        const result = await gateway.execute({ action: "Delete", where: { id_in: ["page-1"] } });

        expect(result).toEqual({ id: "task-1" });
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            action: { action: "Delete", where: { id_in: ["page-1"] } }
        });
        expect(request.query).toMatch(/error\s*\{\s*code\s*message\s*data\s*\}/);
    });

    it("throws a GraphQLOperationError carrying the code, data and message when the envelope has an error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: {
                bulkActions: {
                    data: null,
                    error: { message: "Not authorized.", code: "Workflows/NotAuthorized", data: { a: 1 } }
                }
            }
        });

        const error = await gateway.execute({ action: "Delete" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Not authorized.");
        expect(error.code).toBe("Workflows/NotAuthorized");
        expect(error.data).toEqual({ a: 1 });
    });

    it("keeps its condition: no data and no error throws the fallback with a null code and data", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: { bulkActions: { data: null, error: null } }
        });

        const error = await gateway.execute({ action: "Delete" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not perform the bulk action.");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute({ action: "Delete" }).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn build -p @webiny/app --no-cache 2>&1 | tail -30
yarn test packages/app-website-builder/src/features/pages/deletePage/DeletePageGateway.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionGateway.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/trashBin/WbTrashBinDeleteGateway.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/trashBin/WbTrashBinBulkActionGateway.test.ts 2>&1 | tail -50
```

Expected: FAIL. The typed-error cases fail with `expected Error to be an instance of GraphQLOperationError`; the two trash-bin files also fail on the `error { code message data }` document assertion; `DeletePageRevisionGateway` fails on `variables` (`{ id, permanently: true }` is sent today). Record the RED output.

Also verify A72 for WB before writing source (record the result in the commit message):

```bash
grep -rn "bulkActions\|WbBulkActionsInput" packages/api-website-builder/src packages/api-website-builder-workflows/src packages/api-website-builder-scheduler/src 2>&1 | head
```

Expected: no output (no server definition). If a definition exists, read it: if it triggers a background task like the CMS one, A72 is the same finding as Task 31; otherwise Task 36 extends R228 to that path.

- [ ] **Step 3: Implement**

`packages/app-website-builder/src/features/pages/deletePage/DeletePageGateway.ts`:

```ts
// Before (top of the file):
import { DeletePageGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

// After:
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { DeletePageGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
```

```ts
// Before:
        const envelope = response.websiteBuilder.deletePage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not delete page.");
        }

// After:
        const envelope = response.websiteBuilder.deletePage;
        if (envelope.error) {
            throw new GraphQLOperationError({
                message: envelope.error.message || "Could not delete page.",
                code: envelope.error.code,
                data: envelope.error.data
            });
        }
```

`packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionGateway.ts`:

```ts
// Before (top of the file):
import { DeletePageRevisionGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

// After:
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { DeletePageRevisionGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
```

```ts
// Before:
    async execute(id: string, permanently: boolean) {
        const response = await this.client.execute<DeletePageRevisionResponse>({
            query: DELETE_PAGE_REVISION,
            variables: {
                id,
                permanently
            }
        });

        const envelope = response.websiteBuilder.deletePageRevision;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not delete page revision.");
        }
    }

// After:
    async execute(id: string) {
        const response = await this.client.execute<DeletePageRevisionResponse>({
            query: DELETE_PAGE_REVISION,
            variables: { id }
        });

        const envelope = response.websiteBuilder.deletePageRevision;
        if (envelope.error) {
            throw new GraphQLOperationError({
                message: envelope.error.message || "Could not delete page revision.",
                code: envelope.error.code,
                data: envelope.error.data
            });
        }
    }
```

(`execute(id: string)` still satisfies `IDeletePageRevisionGateway.execute(id, permanently)`; a method may declare fewer parameters than its interface.)

`packages/app-website-builder/src/features/pages/trashBin/WbTrashBinDeleteGateway.ts`:

```ts
// Before (top of the file):
import type { ITrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { TrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

interface DeletePageResponse {
    websiteBuilder: {
        deletePage: {
            data: boolean | null;
            error: { code: string; message: string } | null;
        };
    };
}

// After:
import type { ITrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { TrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

interface DeletePageErrorResponse {
    code: string;
    message: string;
    data?: unknown;
}

interface DeletePageResponse {
    websiteBuilder: {
        deletePage: {
            data: boolean | null;
            error: DeletePageErrorResponse | null;
        };
    };
}
```

```ts
// Before (inside the query):
                            error {
                                code
                                message
                            }

// After:
                            error {
                                code
                                message
                                data
                            }
```

```ts
// Before:
        if (error) {
            throw new Error(error.message || "Could not permanently delete the page.");
        }

// After:
        if (error) {
            throw new GraphQLOperationError({
                message: error.message || "Could not permanently delete the page.",
                code: error.code,
                data: error.data
            });
        }
```

`packages/app-website-builder/src/features/pages/trashBin/WbTrashBinBulkActionGateway.ts`:

```ts
// Before (top of the file, after the abstractions imports):
import { TrashBinBulkActionGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

interface BulkActionsResponse {
    websiteBuilder: {
        bulkActions: {
            data: { id: string } | null;
            error: { code: string; message: string } | null;
        };
    };
}

// After:
import { TrashBinBulkActionGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

interface BulkActionsErrorResponse {
    code: string;
    message: string;
    data?: unknown;
}

interface BulkActionsResponse {
    websiteBuilder: {
        bulkActions: {
            data: { id: string } | null;
            error: BulkActionsErrorResponse | null;
        };
    };
}
```

```ts
// Before (inside the query):
                            error {
                                code
                                message
                            }

// After:
                            error {
                                code
                                message
                                data
                            }
```

```ts
// Before:
        if (error || !data) {
            throw new Error(error?.message || "Could not perform the bulk action.");
        }

// After:
        if (error || !data) {
            throw new GraphQLOperationError({
                message: error?.message || "Could not perform the bulk action.",
                code: error?.code,
                data: error?.data
            });
        }
```

`@webiny/app` is already a dependency of `packages/app-website-builder`; `yarn adio` in Step 6 confirms.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-website-builder/src/features/pages/deletePage/DeletePageGateway.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionGateway.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/trashBin/WbTrashBinDeleteGateway.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/trashBin/WbTrashBinBulkActionGateway.test.ts 2>&1 | tail -50
```

Expected: PASS (4 files).

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-website-builder/src/features/pages/deletePage/DeletePage.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-website-builder --no-cache 2>&1 | tail -30
```

`app-website-builder` has only co-located tests and no `__tests__/**/*.test.ts` file, so `check:test:types` does not list it; the package build is the type check of its tests (R243). Expected: PASS and no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

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
yarn build -p @webiny/app-website-builder --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-website-builder): throw GraphQLOperationError from the page delete gateways" -m "The four delete gateways keep their throw condition and message fallback and now carry the envelope code and data, so the workflows warning can read ActiveReviewOnTrash. The two trash-bin gateways add data to their error selection, and the revision gateway stops sending an undeclared permanently variable. A72: the server defines no WB bulkActions mutation (the admin trash-bin gateway calls a field that does not exist) and the list bulk delete runs one page delete per call, so the WB bulk flow has no background-task path." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start. If the A72 grep in Step 2 found a server definition, replace the A72 sentence of the commit body with what it showed.

## Contract notes

- `DeletePageGateway` sends `permanently` in its variables, but its document declares only `$id` and calls `deletePage(id: $id)`, so the server always trashes (R204). Unchanged by this task: the typed error does not depend on it and no caller sends `permanently: true` through this gateway (the permanent delete from the trash bin uses `WbTrashBinDeleteGateway`, whose document declares `$permanently`).
