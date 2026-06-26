# Handoff: Knex client DI feature for api-core-sql

## Goal

Mirror the `DynamoDBClient` DI feature (just completed in `@webiny/db-dynamodb`,
commit on branch `bruno/refactor/api-websockets-sql`) for the SQL side: make the
Knex instance resolvable from the DI container behind an abstraction, instead of
being threaded through factory parameters.

Scope: create the abstraction + implementation + feature and register it.
**No migrations** — do not rewrite existing storage operations to resolve the
client from the container. That is a follow-up.

## Reference implementation (the DDB version, already committed)

Located at `packages/db-dynamodb/src/feature/DynamoDBClient/`. Three flat files:

### `abstractions.ts`

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface IDynamoDBClient {
    getDocumentClient(): DynamoDBDocument;
}

export const DynamoDBClient = createAbstraction<IDynamoDBClient>("Db/DynamoDB/DynamoDBClient");

export namespace DynamoDBClient {
    export type Interface = IDynamoDBClient;
}
```

### `DynamoDBClient.ts` (implementation)

```ts
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { DynamoDBClient as Abstraction } from "./abstractions.js";

export interface IDynamoDBClientParams {
    client: DynamoDBDocument;
}

export class DynamoDBClient implements Abstraction.Interface {
    private readonly client: DynamoDBDocument;

    public constructor(params: IDynamoDBClientParams) {
        this.client = params.client;
    }

    public getDocumentClient(): DynamoDBDocument {
        return this.client;
    }
}
```

### `index.ts` (feature)

```ts
import { createFeature } from "@webiny/feature/api";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DynamoDBClient as DynamoDBClientAbstraction } from "./abstractions.js";
import { DynamoDBClient } from "./DynamoDBClient.js";

export { DynamoDBClient } from "./abstractions.js";

export const DynamoDBClientFeature = createFeature<DynamoDBDocument>({
    name: "Db/DynamoDB/DynamoDBClientFeature",
    register(container, documentClient) {
        const client = new DynamoDBClient({ client: documentClient });
        container.registerInstance(DynamoDBClientAbstraction, client);
    }
});
```

### Registration (in `packages/db-dynamodb/src/index.ts`)

```ts
interface IRegisterDbDynamoDbExtension {
    documentClient: DynamoDBDocument;
}

export const registerExtension = ({ documentClient }: IRegisterDbDynamoDbExtension) => {
    return createRegisterExtensionPlugin(async context => {
        DynamoDBClientFeature.register(context.container, documentClient);
        FilterUtilFeature.register(context.container);
        ValueFilterFeature.register(context.container);
    });
};
```

## Task: the same for api-core-sql

Create `packages/api-core-sql/src/feature/KnexClient/` with the same three flat
files, adapted:

1. **Abstraction** — `IKnexClient` with `getKnex(): Knex`; abstraction const
   `KnexClient = createAbstraction<IKnexClient>(...)` + namespace with
   `Interface`. Import `type { Knex } from "knex"` (already a dependency of
   `api-core-sql`).
2. **Implementation** — class named `KnexClient` (NOT `KnexClientImpl` — see
   naming note below) implementing `Abstraction.Interface`, constructor takes
   `{ knex: Knex }` params object.
3. **Feature** — `KnexClientFeature = createFeature<Knex>({...})`; in
   `register(container, knex)` instantiate the class and call
   `container.registerInstance(KnexClientAbstraction, instance)`.
4. **Register the feature.** This is the one open decision. Unlike
   `db-dynamodb`, `api-core-sql` has NO `registerExtension` /
   `createRegisterExtensionPlugin` entry point — `createApiCoreSql()`
   (`packages/api-core-sql/src/createApiCoreSql.ts`) is a plain factory with no
   container access. Options, in order of preference:
   - Add a `registerExtension({ knex })` to `api-core-sql/src/index.ts` using
     `createRegisterExtensionPlugin` from `@webiny/handler`, mirroring
     `db-dynamodb` exactly (and how `registerSqlStorageOperations` in
     `api-headless-cms-sql/src/index.ts` does it).
   - Check with Bruno if he'd rather wire it elsewhere.

   If you add a register function, also check the SQL template
   (`packages/project-aws/_templates/extensions/sqlite/api/graphql/src/index.ts`)
   — that is where `createApiCoreSql({ knex })` is invoked, and where a new
   plugin would be added to the `plugins` array.

## Prior art worth knowing

- `packages/api-headless-cms-sql/src/features/knexInstance/` — an existing
  per-package Knex abstraction (`KnexInstance`), registered via
  `KnexInstanceFeature.register(container, config.knex)` inside
  `registerSqlStorageOperations`. The new feature is the same idea; do NOT
  reuse that one (it is CMS-package-local), but its `feature.ts`/
  `abstractions.ts` are a second reference.
- `container.registerInstance(Abstraction, value)` is the API for registering
  pre-built instances (no `createImplementation`/`dependencies` needed since
  the value is a runtime parameter, not a DI-resolvable dependency).

## Conventions and gotchas (learned this session — follow strictly)

- **Keep it simple.** Flat files in the feature folder: `abstractions.ts`,
  `<Name>.ts` (impl), `index.ts` (feature + re-export of abstraction). No
  nested `abstractions/` subfolder, no separate `feature.ts`.
- **Naming (Bruno's explicit choice this session):** the implementation class
  is named the SAME as the abstraction (e.g. class `DynamoDBClient`), no
  `Impl` suffix. In the feature file, alias the abstraction on import:
  `import { KnexClient as KnexClientAbstraction } from "./abstractions.js"`.
- **Don't manually grep/read files for exploration** — use the codegraph MCP
  tools (`codegraph_explore`, `codegraph_search`).
- **Imports:** never deep-import `@aws-sdk/*` in this repo — `yarn adio` will
  fail. (Not relevant for Knex, but the same class of issue: import types from
  the package that is actually listed in `package.json`.)
- One named import per line; class properties always have
  `public/protected/private` + `readonly` where applicable; no `export default`.
- **Before commit, run the full checklist and commit immediately:**

  ```bash
  git add .
  yarn > /dev/null 2>&1
  node scripts/generateTsConfigsInPackages.js
  yarn adio
  yarn format > /dev/null 2>&1
  yarn lint
  yarn webiny sync-dependencies
  git add .
  ```

  Build first with `yarn build -p @webiny/api-core-sql 2>&1 | tail -15`.
  If any step fails and you fix something, rerun the checklist from the top.
- Conventional Commit message, e.g.
  `feat(api-core-sql): add KnexClient DI feature`.

## Branch

Continue on `bruno/refactor/api-websockets-sql` (where the DDB version lives).
