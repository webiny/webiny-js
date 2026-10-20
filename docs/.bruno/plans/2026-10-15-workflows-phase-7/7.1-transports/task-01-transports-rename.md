### Task 1: Rename to `ListNotificationTransports*`, `description`, message shape, delete the `NotificationType*` leftovers

Spec 12, 11; D96, D103, D129, D132, D133 point 6; R190, R191; Contract "Interfaces by task, Task 1" (with the controller ruling: the existing I-prefixed public names stay, only namespace aliases are added). The scaffold from phase 1 calls a transport a "notification type". This task makes the names say what they are and gives the transport the shape phase 7 needs. No behaviour change besides the new `description` field.

- Rename the engine `ListNotificationTypes{UseCase,Repository}` to `ListNotificationTransports{UseCase,Repository}`: the folder `features/notifications/ListNotificationTypes/` becomes `features/notifications/ListNotificationTransports/`, files, class names, abstraction string ids (`"ListNotificationTransportsUseCase"`, `"ListNotificationTransportsRepository"`), feature name and the test file. The use case stays check-free and identity-free (D132, D133 point 6).
- The result row is `NotificationTransportInfo { id: string; title: string; description: string | null }`, new file `domain/notifications/types.ts`. The repository maps every registered `NotificationTransport` to `{ id, title, description: transport.description ?? null }`, in registration order.
- `INotificationTransport` gains `readonly description?: string`; `id` and `title` become plain `string` (they were aliases of the deleted `INotificationType`). The doc comment states the R190 contract: `send` never throws and never fails the notification, it catches, logs once with `Logger.error` and returns.
- `INotificationTransportMessage { title: string; body: string; url: string | null; linkLabel: string }` replaces `INotificationTypeMessage` (`title` is the subject, `body` the text, `url` is `null` when there is no link, `linkLabel` is the link text). The existing `INotificationTransportUser` and `INotificationTransportSendParams` names stay; the namespace `NotificationTransport` gains the aliases `User` and `Message` next to `Interface` and `SendParams`. No public rename.
- `domain/notifications/abstractions.ts` is deleted: `INotificationTypeMessage`, `NotificationTypeMessageOn*`, `INotificationTypes`, `INotificationTypeMessages`, `INotificationType` and `NotificationType` have no consumer left (verified: only the transport abstraction and the list use case import them). No consumer outside `api-workflows` imports them either; the stale `app-workflows` gateway has its own types and is not touched (client phases 8-9).
- `MailNotificationTransport` needs no source change here: it reads only `message.title` and `message.body`, which keep their names. Task 3 rewrites its behaviour.
- `WorkflowsFeature` registers `ListNotificationTransportsFeature`; `registration.test.ts` follows the rename.

**Files:**
- Create: `packages/api-workflows/src/domain/notifications/types.ts`
- Create: `packages/api-workflows/src/features/notifications/ListNotificationTransports/abstractions.ts`
- Create: `packages/api-workflows/src/features/notifications/ListNotificationTransports/ListNotificationTransportsUseCase.ts`
- Create: `packages/api-workflows/src/features/notifications/ListNotificationTransports/ListNotificationTransportsRepository.ts`
- Create: `packages/api-workflows/src/features/notifications/ListNotificationTransports/feature.ts`
- Create: `packages/api-workflows/src/features/notifications/ListNotificationTransports/index.ts`
- Delete: `packages/api-workflows/src/features/notifications/ListNotificationTypes/` (all five files, by `git mv` then edit)
- Delete: `packages/api-workflows/src/domain/notifications/abstractions.ts`
- Modify: `packages/api-workflows/src/features/notifications/NotificationTransport/abstractions.ts`
- Modify: `packages/api-workflows/src/features/notifications/NotificationTransport/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Rename and modify: `packages/api-workflows/__tests__/notifications/ListNotificationTypes.test.ts` to `ListNotificationTransports.test.ts`

**Interfaces:**
- Consumes (existing code):
  - `createAbstraction`, `Result`, `createFeature` (`@webiny/feature/api`), `NonEmptyArray` (`@webiny/api/types.js`).
  - `MailerService` (`@webiny/api-mailer`), `MailNotificationTransport` (unchanged here).
  - `createContextHandler` (`~tests/__helpers/handler.js`; `params.setup(container)` runs after `WorkflowsFeature` is registered).
- Produces (matches the contract):
  - `NotificationTransportInfo { id: string; title: string; description: string | null }` (`~/domain/notifications/types.js`).
  - `INotificationTransport { readonly id: string; readonly title: string; readonly description?: string; send(params: INotificationTransportSendParams): Promise<void> }`, `INotificationTransportMessage`, `INotificationTransportUser`, `INotificationTransportSendParams`; namespace `NotificationTransport.{Interface, SendParams, User, Message}` (used by Tasks 3, 6, 7, 10).
  - `ListNotificationTransportsUseCase` and `ListNotificationTransportsRepository`, both `execute(): Promise<Result<NotificationTransportInfo[]>>` (`~/features/notifications/ListNotificationTransports/index.js`; Task 2 consumes the use case); `ListNotificationTransportsFeature`.

- [ ] **Step 1: Rename the test and write the failing expectations**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
git mv packages/api-workflows/__tests__/notifications/ListNotificationTypes.test.ts \
  packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts
```

Replace the whole content of `packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import type { Container } from "@webiny/feature/api";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ListNotificationTransportsUseCase } from "~/features/notifications/ListNotificationTransports/index.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";

const createNotificationsContext = async (
    permissions: SecurityPermission[],
    register?: (container: Container) => void
) => {
    // `NotificationTransport` depends on the mailer, which the test context does not provide.
    const { context } = await createContextHandler({
        permissions,
        setup: container => {
            container.registerInstance(MailerService, {} as MailerService.Interface);
            register?.(container);
        }
    });
    return context.container;
};

describe("ListNotificationTransportsUseCase (internal, D133)", () => {
    it("lists the registered transports without a workflows permission", async () => {
        const container = await createNotificationsContext([]);
        const transports = container.resolveAll(NotificationTransport);

        const result = await container.resolve(ListNotificationTransportsUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(
            transports.map(transport => {
                return {
                    id: transport.id,
                    title: transport.title,
                    description: transport.description ?? null
                };
            })
        );
    });

    it("lists the registered transports for a user with reassign only", async () => {
        const container = await createNotificationsContext([{ name: "workflows", reassign: true }]);

        const result = await container.resolve(ListNotificationTransportsUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toContainEqual({
            id: "e-mail",
            title: expect.any(String),
            description: null
        });
    });

    it("lists a transport with a description and one without as null", async () => {
        const container = await createNotificationsContext([], registered => {
            registered.registerInstance(NotificationTransport, {
                id: "described",
                title: "Described",
                description: "Tells the people who need to act.",
                send: async () => {}
            });
            registered.registerInstance(NotificationTransport, {
                id: "plain",
                title: "Plain",
                send: async () => {}
            });
        });

        const result = await container.resolve(ListNotificationTransportsUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toContainEqual({
            id: "described",
            title: "Described",
            description: "Tells the people who need to act."
        });
        expect(result.value).toContainEqual({ id: "plain", title: "Plain", description: null });
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts` change the import block and the two assertions (exact new lines):

```ts
import {
    ListNotificationTransportsRepository,
    ListNotificationTransportsUseCase
} from "~/features/notifications/ListNotificationTransports/index.js";
```

```ts
        expect(container.resolveAll(ListNotificationTransportsUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListNotificationTransportsRepository)).toHaveLength(1);
```

- [ ] **Step 2: Run the tests and record the failure**

```bash
yarn test packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
```

Expected: FAIL on both, `Failed to resolve import "~/features/notifications/ListNotificationTransports/index.js"` (the folder does not exist yet).

- [ ] **Step 3: Implement**

Move the folder and the files:

```bash
cd /Users/brunozoric/work/webiny/webiny-js/packages/api-workflows/src/features/notifications
git mv ListNotificationTypes ListNotificationTransports
cd ListNotificationTransports
git mv ListNotificationTypesUseCase.ts ListNotificationTransportsUseCase.ts
git mv ListNotificationTypesRepository.ts ListNotificationTransportsRepository.ts
cd /Users/brunozoric/work/webiny/webiny-js
git rm packages/api-workflows/src/domain/notifications/abstractions.ts
```

Create `packages/api-workflows/src/domain/notifications/types.ts`:

```ts
/**
 * One registered notification transport, as the transports operation lists it (D129, R191).
 * `description` is `null` when the transport has none.
 */
export interface NotificationTransportInfo {
    id: string;
    title: string;
    description: string | null;
}
```

Replace `packages/api-workflows/src/features/notifications/NotificationTransport/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { NonEmptyArray } from "@webiny/api/types.js";

export interface INotificationTransportUser {
    id: string;
    email: string;
    displayName: string;
}

/**
 * What a transport sends. `title` is the subject line, `body` the plain text, `url` the link to
 * the content (`null` when there is none) and `linkLabel` the text of that link (R190).
 */
export interface INotificationTransportMessage {
    title: string;
    body: string;
    url: string | null;
    linkLabel: string;
}

export interface INotificationTransportSendParams {
    users: NonEmptyArray<INotificationTransportUser>;
    message: INotificationTransportMessage;
}

export interface INotificationTransport {
    readonly id: string;
    readonly title: string;
    /** Shown next to the transport in the workflow editor (D129). */
    readonly description?: string;
    /**
     * Never throws and never fails the notification (R190, R87): the review action that caused it
     * has already been saved. A transport catches its own failures, logs each one once with
     * `Logger.error` (never the error text of a mailer or provider, which can embed addresses)
     * and returns.
     */
    send(params: INotificationTransportSendParams): Promise<void>;
}

export const NotificationTransport = createAbstraction<INotificationTransport>(
    "WorkflowNotificationTransport"
);

export namespace NotificationTransport {
    export type Interface = INotificationTransport;
    export type SendParams = INotificationTransportSendParams;
    export type User = INotificationTransportUser;
    export type Message = INotificationTransportMessage;
}
```

Replace `packages/api-workflows/src/features/notifications/NotificationTransport/index.ts`:

```ts
export { NotificationTransportFeature } from "./feature.js";
export { NotificationTransport } from "./abstractions.js";
export type {
    INotificationTransportSendParams,
    INotificationTransport,
    INotificationTransportMessage,
    INotificationTransportUser
} from "./abstractions.js";
```

Replace `.../ListNotificationTransports/abstractions.ts`:

```ts
import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { NotificationTransportInfo } from "~/domain/notifications/types.js";

/**
 * ListNotificationTransports use case interface. Internal (D132): no permission check, so no
 * error of its own; the shared transports operation checks `editor` (D133).
 */
export interface IListNotificationTransportsUseCase {
    execute(): Promise<Result<NotificationTransportInfo[]>>;
}

export const ListNotificationTransportsUseCase =
    createAbstraction<IListNotificationTransportsUseCase>("ListNotificationTransportsUseCase");

export namespace ListNotificationTransportsUseCase {
    export type Interface = IListNotificationTransportsUseCase;
    export type Return = Promise<Result<NotificationTransportInfo[]>>;
}

/**
 * ListNotificationTransports repository interface
 */
export interface IListNotificationTransportsRepository {
    execute(): Promise<Result<NotificationTransportInfo[]>>;
}

export const ListNotificationTransportsRepository =
    createAbstraction<IListNotificationTransportsRepository>(
        "ListNotificationTransportsRepository"
    );

export namespace ListNotificationTransportsRepository {
    export type Interface = IListNotificationTransportsRepository;
    export type Return = Promise<Result<NotificationTransportInfo[]>>;
}
```

Replace `.../ListNotificationTransports/ListNotificationTransportsRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ListNotificationTransportsRepository as Repository } from "./abstractions.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";

class ListNotificationTransportsRepositoryImpl implements Repository.Interface {
    private readonly transports;

    public constructor(transports: NotificationTransport.Interface[]) {
        this.transports = transports;
    }

    public async execute(): Repository.Return {
        return Result.ok(
            this.transports.map(transport => {
                return {
                    id: transport.id,
                    title: transport.title,
                    description: transport.description ?? null
                };
            })
        );
    }
}

export const ListNotificationTransportsRepository = Repository.createImplementation({
    implementation: ListNotificationTransportsRepositoryImpl,
    dependencies: [[NotificationTransport, { multiple: true }]]
});
```

Replace `.../ListNotificationTransports/ListNotificationTransportsUseCase.ts`:

```ts
import {
    ListNotificationTransportsRepository,
    ListNotificationTransportsUseCase as UseCase
} from "./abstractions.js";

/**
 * Lists the registered notification transports. Internal (D132): reads no identity and checks no
 * permission; the shared transports operation checks `editor` (D133, R40).
 */
class ListNotificationTransportsUseCaseImpl implements UseCase.Interface {
    public constructor(private repository: ListNotificationTransportsRepository.Interface) {}

    public async execute(): UseCase.Return {
        return this.repository.execute();
    }
}

export const ListNotificationTransportsUseCase = UseCase.createImplementation({
    implementation: ListNotificationTransportsUseCaseImpl,
    dependencies: [ListNotificationTransportsRepository]
});
```

Replace `.../ListNotificationTransports/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListNotificationTransportsUseCase } from "./ListNotificationTransportsUseCase.js";
import { ListNotificationTransportsRepository } from "./ListNotificationTransportsRepository.js";

export const ListNotificationTransportsFeature = createFeature({
    name: "WorkflowNotifications/ListNotificationTransports",
    register(container) {
        container.register(ListNotificationTransportsRepository).inSingletonScope();
        container.register(ListNotificationTransportsUseCase);
    }
});
```

Replace `.../ListNotificationTransports/index.ts`:

```ts
export { ListNotificationTransportsFeature } from "./feature.js";
export {
    ListNotificationTransportsRepository,
    ListNotificationTransportsUseCase
} from "./abstractions.js";
export type {
    IListNotificationTransportsUseCase,
    IListNotificationTransportsRepository
} from "./abstractions.js";
```

In `packages/api-workflows/src/WorkflowsFeature.ts` change the import (line 7) and the notifications block (lines 81-83):

```ts
import { ListNotificationTransportsFeature } from "~/features/notifications/ListNotificationTransports/index.js";
```

```ts
        // Notifications (internal, no permission check, D133; recipient rules arrive in phase 7)
        ListNotificationTransportsFeature.register(container);
        NotificationTransportFeature.register(container);
```

(The comment stays; Task 10 and 7.4 replace it when the notifications feature lands.)

`MailNotificationTransport.ts` is not changed in this task (it still compiles: it reads `message.title` and `message.body`, and it imports only `NotificationTransport`).

- [ ] **Step 4: Run the tests and see them pass**

```bash
yarn test packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts 2>&1 | tail -50
```

Expected: PASS, 3 tests, both storages.

- [ ] **Step 5: Run the existing tests covering the changed code and the leftover check**

```bash
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40
grep -rnE "ListNotificationTypes|NotificationType|INotificationType" packages/api-workflows/src packages/api-workflows/__tests__ || echo "no leftovers"
```

Expected: both registration runs PASS, no type errors in the touched package (this also checks the `INotificationTransportMessage` shape, `url: string | null`, that the notification tests build), and `no leftovers` printed. (`packages/app-workflows` still has its own stale `ListNotificationTypes*` gateway and its `listWorkflowNotificationTypes` query; it is not touched here, client phases 8-9.)

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
git commit -m "refactor(api-workflows): rename the notification types list to transports, add a transport description and message url" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.
