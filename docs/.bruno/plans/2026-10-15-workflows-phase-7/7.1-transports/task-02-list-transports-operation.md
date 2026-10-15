### Task 2: `listNotificationTransports` shared operation and GraphQL

Spec 12, 11; D96, D129, D132, D133 points 2 and 6; R87, R191; SEC-66 not involved (no user lookup). The workflow editor lists the registered transports in its "Notify via" picker. The engine use case from Task 1 is check-free (D132); this task adds the shared operation behind `editor` and exposes it on `WorkflowsQuery`. It is a mirror of `ListWorkflowAiToolsUseCase`.

- `ListWorkflowNotificationTransportsUseCase.execute(): Promise<Result<NotificationTransportInfo[], UseCaseError>>`, `UseCaseError = WorkflowsNotAuthenticatedError | WorkflowsNotAuthorizedError | WorkflowPersistenceError`.
- Order of checks, copied from `ListWorkflowAiToolsUseCase`: the viewer actor (`CurrentReviewViewer.getActor()`; a failed Result is returned as is, which is `Workflows/NotAuthenticated`), then `permissions.canEdit()` inside a try/catch (a throw is logged once with `Logger.error({ error }, "Could not list the workflow notification transports.")` and returned as `WorkflowPersistenceError(new Error("Could not list the notification transports."))`), then not `canEdit` returns `WorkflowsNotAuthorizedError({ action: "list notification transports" })` (message `You are not allowed to list notification transports.`).
- The engine `ListNotificationTransportsUseCase` is called inside a try/catch. A failed Result and a throw each log once with the same fixed log text (the failed Result logs `{ error: result.error }`, a throw logs `{ error }`) and return the same fixed `WorkflowPersistenceError`; the raw text is never in the returned error (R146 mirror).
- Rows are sorted by `title` (`localeCompare`), then by `id`. `description` is `null` or the transport's text; nothing else is exposed.
- GraphQL: `type WorkflowsNotificationTransport { id: ID! title: String! description: String }`, `type WorkflowsNotificationTransportListResponse { data: [WorkflowsNotificationTransport!] error: WorkflowsError }` and `WorkflowsQuery.listNotificationTransports: WorkflowsNotificationTransportListResponse!` placed right after `listAiTools`. The resolver mirrors the `listAiTools` one.
- The engine list is in-memory (registered transports), so this use case mirrors `ListWorkflowAiToolsUseCase` and logs `{ error }` like it; the code-and-name-only log rule (R196) covers the notifier and the mail transport, whose errors can embed addresses.
- The `app-workflows` gateway and its `listWorkflowNotificationTypes` query are not touched (client phases 8-9).

**Files:**
- Create: `packages/api-workflows/src/features/config/ListWorkflowNotificationTransports/abstractions.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowNotificationTransports/ListWorkflowNotificationTransportsUseCase.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowNotificationTransports/feature.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowNotificationTransports/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Create: `packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes:
  - Task 1: `ListNotificationTransportsUseCase` (`~/features/notifications/ListNotificationTransports/index.js`, `execute(): Promise<Result<NotificationTransportInfo[]>>`), `NotificationTransportInfo` (`~/domain/notifications/types.js`), `NotificationTransport` (`~/features/notifications/NotificationTransport/index.js`).
  - Existing: `CurrentReviewViewer` (`~/features/identity/CurrentReviewViewer/index.js`, `getActor()` returns a Result), `WorkflowsPermissions` (`canEdit(): Promise<boolean>`), `WorkflowsNotAuthenticatedError`, `WorkflowsNotAuthorizedError` (`~/domain/permissions/errors.js`), `WorkflowPersistenceError` (`~/domain/workflow/errors.js`, takes a `PersistenceErrorSource` with `message`), `Logger` (`@webiny/api-core/features/logger/index.js`).
  - Existing test helpers: `createContextHandler` (`~tests/__helpers/handler.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`), `expectOk` (`~tests/__helpers/fixtures.js`); in the GraphQL test the file's own `createApi`, `EDITOR`, `REASSIGNER`, `ERROR_FIELDS`, `memberNames`.
- Produces (matches the contract):
  - `ListWorkflowNotificationTransportsUseCase` (`~/features/config/ListWorkflowNotificationTransports/index.js`) with `Interface`, `Error` and `Return` namespace types, registered by `ListWorkflowNotificationTransportsFeature` in `WorkflowsFeature`.
  - `WorkflowsQuery.listNotificationTransports`. No export for later tasks.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { MailerService } from "@webiny/api-mailer";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
import { ListNotificationTransportsUseCase } from "~/features/notifications/ListNotificationTransports/index.js";
import { ListWorkflowNotificationTransportsUseCase } from "~/features/config/ListWorkflowNotificationTransports/index.js";

const FIXED_MESSAGE = "Could not list the notification transports.";

const expectFixedFailure = (
    result: Awaited<ReturnType<ListWorkflowNotificationTransportsUseCase.Interface["execute"]>>,
    rawText: string
) => {
    expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    expect(result.error.message).toBe(FIXED_MESSAGE);
    expect(
        JSON.stringify({ message: result.error.message, data: result.error.data })
    ).not.toContain(rawText);
    expect(loggedErrors).toHaveLength(1);
    expect(loggedErrors[0].message).toBe("Could not list the workflow notification transports.");
    expect((loggedErrors[0].fields.error as Error).message).toBe(rawText);
};

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const registerTransport = (
    container: Container,
    id: string,
    title: string,
    description?: string
) => {
    container.registerInstance(NotificationTransport, {
        id,
        title,
        description,
        send: async () => {}
    });
};

const createListContext = async (params: CmsTestHandlerParams = {}) => {
    loggedErrors.length = 0;
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            // The built-in e-mail transport depends on the mailer, which the test context lacks.
            container.registerInstance(MailerService, {} as MailerService.Interface);
            await params.setup?.(container);
        }
    });
    return {
        container: context.container,
        listTransports: context.container.resolve(ListWorkflowNotificationTransportsUseCase)
    };
};

describe("ListWorkflowNotificationTransportsUseCase (R191, D133)", () => {
    it("lists the built-in e-mail transport for an editor", async () => {
        const { listTransports } = await createListContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        const rows = expectOk(await listTransports.execute());

        expect(rows).toEqual([
            {
                id: "e-mail",
                title: "E-Mail",
                // Task 3 adds the description and updates this expectation.
                description: null
            }
        ]);
    });

    it("lists id, title and description only, with a missing description as null", async () => {
        const { listTransports } = await createListContext({
            permissions: [{ name: "workflows", editor: true }],
            setup: container => {
                registerTransport(container, "plain", "Plain");
                registerTransport(container, "described", "Described", "Tells the team.");
            }
        });

        const rows = expectOk(await listTransports.execute());

        expect(rows).toContainEqual({ id: "plain", title: "Plain", description: null });
        expect(rows).toContainEqual({
            id: "described",
            title: "Described",
            description: "Tells the team."
        });
        for (const row of rows) {
            expect(Object.keys(row)).toEqual(["id", "title", "description"]);
        }
    });

    it("sorts the rows by title, then by id", async () => {
        const { listTransports } = await createListContext({
            setup: container => {
                registerTransport(container, "zulu", "Zulu");
                registerTransport(container, "alphaTwo", "Alpha");
                registerTransport(container, "mike", "Mike");
                registerTransport(container, "alphaOne", "Alpha");
            }
        });

        const rows = expectOk(await listTransports.execute());

        expect(rows.map(row => row.id)).toEqual(["alphaOne", "alphaTwo", "e-mail", "mike", "zulu"]);
    });

    it("allows a full-access permission set", async () => {
        const { listTransports } = await createListContext({
            permissions: [{ name: "workflows.*" }]
        });

        expect((await listTransports.execute()).isOk()).toBe(true);
    });

    it("refuses a user without editor", async () => {
        const { listTransports } = await createListContext({
            permissions: [{ name: "workflows", reassign: true }]
        });

        const result = await listTransports.execute();

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.message).toBe("You are not allowed to list notification transports.");
        expect(result.error.data).toEqual({ action: "list notification transports" });
    });

    it("refuses an anonymous identity", async () => {
        const { container, listTransports } = await createListContext();

        const result = await container
            .resolve(IdentityContext)
            .withIdentity(new AnonymousIdentity(), () => listTransports.execute());

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("returns the workflow persistence error when the permission check throws, logged once (R87)", async () => {
        const { listTransports } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listTransports.execute();

        expectFixedFailure(result, "Permissions are down.");
    });

    it("returns the workflow persistence error when the engine list throws, logged once (R87)", async () => {
        const { listTransports } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                container.registerInstance(ListNotificationTransportsUseCase, {
                    execute: async () => {
                        throw new Error("The transport list is down.");
                    }
                });
            }
        });

        const result = await listTransports.execute();

        expectFixedFailure(result, "The transport list is down.");
    });

    it("returns the workflow persistence error when the engine list fails, logged once (R87)", async () => {
        const { listTransports } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                container.registerInstance(ListNotificationTransportsUseCase, {
                    execute: async () => {
                        return Result.fail(new Error("The transport list failed.") as never);
                    }
                });
            }
        });

        const result = await listTransports.execute();

        expectFixedFailure(result, "The transport list failed.");
    });
});
```

In `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`:

1. After the `LIST_AI_TOOLS` constant add:

```ts
const LIST_NOTIFICATION_TRANSPORTS = /* GraphQL */ `
    query ListNotificationTransports {
        workflows {
            listNotificationTransports {
                data {
                    id
                    title
                    description
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;
```

2. After `interface ListAiToolsResult { ... }` add:

```ts
interface NotificationTransportRow {
    id: string;
    title: string;
    description: string | null;
}

interface NotificationTransportsEnvelope {
    data: NotificationTransportRow[] | null;
    error: ErrorRow | null;
}

interface ListNotificationTransportsResult {
    listNotificationTransports: NotificationTransportsEnvelope;
}
```

3. In the object `createApi` returns, after the `listAiTools:` line add:

```ts
        listNotificationTransports: createQuery<
            GraphQLBody<WorkflowsRoot<ListNotificationTransportsResult>>
        >(LIST_NOTIFICATION_TRANSPORTS),
```

4. Next to the existing `listAiTools` tests add (the file's `createApi`, `EDITOR` and `REASSIGNER` are reused; the test context needs the mailer stub because the e-mail transport depends on it, so pass it through `setup` like the other tests that need a registration):

```ts
    it("lists the notification transports for an editor with an optional description", async () => {
        const api = await createApi({
            permissions: EDITOR,
            setup: container => {
                container.registerInstance(MailerService, {} as MailerService.Interface);
                container.registerInstance(NotificationTransport, {
                    id: "plain",
                    title: "Plain",
                    send: async () => {}
                });
            }
        });

        const [response] = await api.listNotificationTransports();

        expect(response.data.workflows.listNotificationTransports).toEqual({
            data: [
                // Task 3 adds the description and updates this expectation.
                { id: "e-mail", title: "E-Mail", description: null },
                { id: "plain", title: "Plain", description: null }
            ],
            error: null
        });
    });

    it("refuses the notification transports to a user without editor", async () => {
        const api = await createApi({
            permissions: REASSIGNER,
            setup: container => {
                container.registerInstance(MailerService, {} as MailerService.Interface);
            }
        });

        const [response] = await api.listNotificationTransports();

        expect(response.data.workflows.listNotificationTransports).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list notification transports.",
                data: { action: "list notification transports" }
            }
        });
    });
```

Add the imports at the top of the file:

```ts
import { MailerService } from "@webiny/api-mailer";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
```


5. In the introspection test change the expected `WorkflowsQuery` members and add the two new types:

```ts
        expect(memberNames(types, "WorkflowsQuery")).toEqual([
            "getSettings",
            "listStepTypes",
            "listAutomationDefinitions",
            "listAiTools",
            "listNotificationTransports",
            "listUsers"
        ]);
```

```ts
        expect(memberNames(types, "WorkflowsNotificationTransport")).toEqual([
            "id",
            "title",
            "description"
        ]);
        expect(memberNames(types, "WorkflowsNotificationTransportListResponse")).toEqual([
            "data",
            "error"
        ]);
```

In `packages/api-workflows/__tests__/registration.test.ts` add the import and the assertion (next to the `ListWorkflowAiToolsUseCase` ones if present, otherwise after the `ListNotificationTransportsRepository` line):

```ts
import { ListWorkflowNotificationTransportsUseCase } from "~/features/config/ListWorkflowNotificationTransports/index.js";
```

```ts
        expect(container.resolveAll(ListWorkflowNotificationTransportsUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run the tests and record the failure**

```bash
yarn test packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
```

Expected: the first two FAIL on the missing import `~/features/config/ListWorkflowNotificationTransports/index.js`; the GraphQL test FAILS (`Cannot query field "listNotificationTransports"` and the member list); registration FAILS on the same missing import.

- [ ] **Step 3: Implement**

Create `packages/api-workflows/src/features/config/ListWorkflowNotificationTransports/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { NotificationTransportInfo } from "~/domain/notifications/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface IListWorkflowNotificationTransportsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError =
    IListWorkflowNotificationTransportsUseCaseErrors[keyof IListWorkflowNotificationTransportsUseCaseErrors];

export interface IListWorkflowNotificationTransportsUseCase {
    execute(): Promise<Result<NotificationTransportInfo[], UseCaseError>>;
}

/**
 * The notification transports a workflow author can pick on a step (D129, R191): needs
 * `workflows.editor`. Sorted by title. The shared `listNotificationTransports` GraphQL operation
 * calls this.
 */
export const ListWorkflowNotificationTransportsUseCase =
    createAbstraction<IListWorkflowNotificationTransportsUseCase>(
        "ListWorkflowNotificationTransportsUseCase"
    );

export namespace ListWorkflowNotificationTransportsUseCase {
    export type Interface = IListWorkflowNotificationTransportsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<NotificationTransportInfo[], UseCaseError>>;
}
```

Create `.../ListWorkflowNotificationTransports/ListWorkflowNotificationTransportsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { NotificationTransportInfo } from "~/domain/notifications/types.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListNotificationTransportsUseCase } from "~/features/notifications/ListNotificationTransports/index.js";
import { ListWorkflowNotificationTransportsUseCase as UseCase } from "./abstractions.js";

const FAILURE_MESSAGE = "Could not list the notification transports.";
const FAILURE_LOG = "Could not list the workflow notification transports.";

class ListWorkflowNotificationTransportsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private listTransports: ListNotificationTransportsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            this.logger.error({ error }, FAILURE_LOG);
            return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
        }
        if (!canEdit) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({ action: "list notification transports" })
            );
        }

        let rows: NotificationTransportInfo[];
        try {
            const result = await this.listTransports.execute();
            if (result.isFail()) {
                this.logger.error({ error: result.error }, FAILURE_LOG);
                return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
            }
            rows = [...result.value];
        } catch (error) {
            this.logger.error({ error }, FAILURE_LOG);
            return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
        }
        rows.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
        return Result.ok(rows);
    }
}

export const ListWorkflowNotificationTransportsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowNotificationTransportsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        ListNotificationTransportsUseCase,
        Logger
    ]
});
```

Create `.../ListWorkflowNotificationTransports/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWorkflowNotificationTransportsUseCase } from "./ListWorkflowNotificationTransportsUseCase.js";

export const ListWorkflowNotificationTransportsFeature = createFeature({
    name: "Workflows/ListWorkflowNotificationTransports",
    register(container) {
        container.register(ListWorkflowNotificationTransportsUseCase);
    }
});
```

Create `.../ListWorkflowNotificationTransports/index.ts`:

```ts
export { ListWorkflowNotificationTransportsUseCase } from "./abstractions.js";
export type { NotificationTransportInfo } from "~/domain/notifications/types.js";
```

In `packages/api-workflows/src/WorkflowsFeature.ts` add the import next to the `ListWorkflowAiToolsFeature` one and the registration after it:

```ts
import { ListWorkflowNotificationTransportsFeature } from "~/features/config/ListWorkflowNotificationTransports/feature.js";
```

```ts
        ListWorkflowAiToolsFeature.register(container);
        ListWorkflowNotificationTransportsFeature.register(container);
        ListWorkflowUsersFeature.register(container);
```

In `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`:

Add the import next to `ListWorkflowAiToolsUseCase`:

```ts
import { ListWorkflowNotificationTransportsUseCase } from "~/features/config/ListWorkflowNotificationTransports/index.js";
```

Add the types after `WorkflowsAiToolListResponse`:

```graphql
    type WorkflowsNotificationTransport {
        "The id a step stores in its notifications."
        id: ID!
        title: String!
        "What the transport does; null when it has no description."
        description: String
    }

    type WorkflowsNotificationTransportListResponse {
        data: [WorkflowsNotificationTransport!]
        error: WorkflowsError
    }
```

Add the query field right after `listAiTools: WorkflowsAiToolListResponse!`:

```graphql
        listNotificationTransports: WorkflowsNotificationTransportListResponse!
```

Add the resolver right after the `WorkflowsQuery.listAiTools` one:

```ts
        builder.addResolver({
            path: "WorkflowsQuery.listNotificationTransports",
            dependencies: [ListWorkflowNotificationTransportsUseCase],
            resolver: (listTransports: ListWorkflowNotificationTransportsUseCase.Interface) => {
                return async () => {
                    const result = await listTransports.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

The built-in e-mail transport has no description until Task 3, so the two e-mail expectations above assert `description: null` here; Task 3 Step 3 updates them.

- [ ] **Step 4: Run the tests and see them pass**

```bash
yarn test packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
```

Expected: PASS on both storages (the e-mail row asserted with `description: null` until Task 3).

- [ ] **Step 5: Run the existing tests covering the changed code**

```bash
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40
```

Expected: all PASS, no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full, building each changed package with `--no-cache`, and restore `.gitleaks.toml`:

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
yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(api-workflows): add the listNotificationTransports operation for editors" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.
