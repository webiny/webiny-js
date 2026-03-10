---
name: webiny-dependency-injection
context: webiny-extensions
description: >
  The universal createImplementation DI pattern and all injectable services.
  Use this skill when the developer is writing any Webiny extension and needs to understand
  dependency injection, constructor injection, how to access Logger/BuildParams/IdentityContext,
  how to inject CMS use-cases (list/get/create/update/delete entries), or how the dependencies
  array works. This is the connective tissue across all extension types -- API, Admin, CLI,
  and Infrastructure.
---

# Dependency Injection Patterns

## TL;DR

Every Webiny extension type uses the same DI pattern: define a class implementing `*.Interface`, declare dependencies in the constructor, and export via `*.createImplementation({ implementation, dependencies })`. The DI container automatically provides the required services, ensures type safety, and validates at compile time. This pattern is the connective tissue across all extension types -- API, Admin, CLI, and Infrastructure.

## The Universal Pattern

```typescript
import { SomeFactory } from "webiny/some/path";
import { Logger } from "webiny/api/logger";
import { BuildParams } from "webiny/api/build-params";

class MyImplementation implements SomeFactory.Interface {
  constructor(
    private logger: Logger.Interface,
    private buildParams: BuildParams.Interface
  ) {}

  execute(/* factory-specific params */) {
    this.logger.info("Doing something...");
    const value = this.buildParams.get<string>("MY_PARAM");
  }
}

export default SomeFactory.createImplementation({
  implementation: MyImplementation,
  dependencies: [Logger, BuildParams]
});
```

Key rules:

1. **One class per file** -- each extension file exports a single implementation.
2. **Constructor injection** -- dependencies are received as constructor parameters, in the same order as the `dependencies` array.
3. **Dependencies array** -- must exactly match the constructor parameter order and types.
4. **Interface types** -- always type constructor params as `Feature.Interface`.

## Where This Pattern Appears

| Extension Type  | Factory                | Import Path              |
| --------------- | ---------------------- | ------------------------ |
| Content Models  | `ModelFactory`         | `"webiny/api/cms/model"` |
| GraphQL Schemas | `GraphQLSchemaFactory` | `"webiny/api/graphql"`   |
| API Keys        | `ApiKeyFactory`        | `"webiny/api/security"`  |
| CLI Commands    | `CliCommandFactory`    | `"webiny/cli/command"`   |
| Pulumi Handlers | `CorePulumi`           | `"webiny/infra/core"`    |

> **Event handlers** use the same `createImplementation` pattern but are not injectable dependencies. See the `lifecycle-events` skill for the full list.

## Injectable Abstractions

Every Abstraction listed below can be used as a constructor dependency or as a base for `createImplementation`. Import from the `"webiny/..."` path shown.

### `webiny/api/build-params`

| Abstraction  | Purpose                  |
| ------------ | ------------------------ |
| `BuildParam` | Define a build parameter |
| `BuildParams` | Access build-time parameters |

### `webiny/api/logger`

| Abstraction | Purpose                          |
| ----------- | -------------------------------- |
| `Logger`    | Logging (persists to CloudWatch) |

### `webiny/api/key-value-store`

| Abstraction          | Purpose                        |
| -------------------- | ------------------------------ |
| `GlobalKeyValueStore` | Global (cross-tenant) key-value store |
| `KeyValueStore`      | Tenant-scoped key-value store  |

### `webiny/api/event-publisher`

| Abstraction      | Purpose              |
| ---------------- | -------------------- |
| `EventPublisher` | Publish domain events |

### `webiny/api/graphql`

| Abstraction            | Purpose               |
| ---------------------- | --------------------- |
| `GraphQLSchemaFactory` | Define GraphQL schemas |

### `webiny/api/tasks`

| Abstraction      | Purpose                |
| ---------------- | ---------------------- |
| `TaskService`    | Task management service |
| `TaskDefinition` | Define a background task |

### `webiny/api/system`

| Abstraction            | Purpose                   |
| ---------------------- | ------------------------- |
| `InstallSystemUseCase` | System installation logic |

### `webiny/api/security`

| Abstraction           | Purpose                               |
| --------------------- | ------------------------------------- |
| `IdentityContext`     | Current user identity and permissions |
| `ApiKeyFactory`       | Define custom API key types           |
| `IdentityProvider`    | Base identity provider abstraction    |
| `OidcIdentityProvider` | OIDC identity provider               |
| `JwtIdentityProvider` | JWT identity provider                 |
| `Authenticator`       | Authentication logic                  |
| `Authorizer`          | Authorization logic                   |

### `webiny/api/security/api-key`

| Abstraction             | Purpose                     |
| ----------------------- | --------------------------- |
| `CreateApiKeyUseCase`   | Create an API key           |
| `DeleteApiKeyUseCase`   | Delete an API key           |
| `GetApiKeyUseCase`      | Get API key by ID           |
| `GetApiKeyByTokenUseCase` | Get API key by token      |
| `ListApiKeysUseCase`    | List all API keys           |
| `UpdateApiKeyUseCase`   | Update an API key           |
| `ApiKeyFactory`         | Define custom API key types |

### `webiny/api/security/role`

| Abstraction       | Purpose        |
| ----------------- | -------------- |
| `CreateRoleUseCase` | Create a role |
| `DeleteRoleUseCase` | Delete a role |
| `GetRoleUseCase`    | Get role by ID |
| `ListRolesUseCase`  | List all roles |
| `UpdateRoleUseCase` | Update a role |

### `webiny/api/security/user`

| Abstraction          | Purpose           |
| -------------------- | ----------------- |
| `CreateUserUseCase`  | Create a user     |
| `DeleteUserUseCase`  | Delete a user     |
| `UpdateUserUseCase`  | Update a user     |
| `GetUserUseCase`     | Get user by ID    |
| `ListUsersUseCase`   | List all users    |
| `ListUserTeamsUseCase` | List user's teams |

### `webiny/api/tenancy`

| Abstraction              | Purpose                              |
| ------------------------ | ------------------------------------ |
| `TenantContext`          | Current tenant information           |
| `CreateTenantUseCase`    | Create a tenant                      |
| `CreateTenantRepository` | Tenant creation storage              |
| `GetTenantByIdUseCase`   | Fetch tenant by ID                   |
| `UpdateTenantUseCase`    | Update a tenant                      |
| `UpdateTenantRepository` | Tenant update storage                |
| `DeleteTenantUseCase`    | Delete a tenant                      |
| `DeleteTenantRepository` | Tenant deletion storage              |
| `InstallTenantUseCase`   | Install a tenant                     |
| `AppInstaller`           | App installation during tenant install |

### `webiny/api/tenant-manager`

| Abstraction            | Purpose                        |
| ---------------------- | ------------------------------ |
| `TenantModelExtension` | Extend tenant data model       |

### `webiny/api/cms/entry`

| Abstraction                                         | Purpose                             |
| --------------------------------------------------- | ----------------------------------- |
| `CreateEntryUseCase`                                | Create a CMS entry                  |
| `CreateEntryRevisionFromUseCase`                    | Create entry revision from existing |
| `DeleteEntryUseCase`                                | Delete an entry                     |
| `MoveEntryToBinUseCase`                             | Move entry to bin                   |
| `DeleteEntryRevisionUseCase`                        | Delete a specific revision          |
| `DeleteMultipleEntriesUseCase`                      | Delete multiple entries             |
| `MoveEntryUseCase`                                  | Move entry to folder                |
| `PublishEntryUseCase`                               | Publish an entry                    |
| `RepublishEntryUseCase`                             | Republish an entry                  |
| `RestoreEntryFromBinUseCase`                        | Restore entry from bin              |
| `UnpublishEntryUseCase`                             | Unpublish an entry                  |
| `UpdateEntryUseCase`                                | Update an entry                     |
| `UpdateSingletonEntryUseCase`                       | Update a singleton entry            |
| `GetEntriesByIdsUseCase`                            | Get entries by IDs                  |
| `GetEntryUseCase`                                   | Get entry by query                  |
| `GetEntryByIdUseCase`                               | Get entry by revision ID            |
| `GetLatestEntriesByIdsUseCase`                      | Get latest entries by IDs           |
| `GetLatestRevisionByEntryIdBaseUseCase`             | Get latest revision (base)          |
| `GetLatestRevisionByEntryIdUseCase`                 | Get latest revision                 |
| `GetLatestDeletedRevisionByEntryIdUseCase`          | Get latest deleted revision         |
| `GetLatestRevisionByEntryIdIncludingDeletedUseCase` | Get latest revision (incl. deleted) |
| `GetPreviousRevisionByEntryIdBaseUseCase`           | Get previous revision (base)        |
| `GetPreviousRevisionByEntryIdUseCase`               | Get previous revision               |
| `GetPublishedEntriesByIdsUseCase`                   | Get published entries by IDs        |
| `GetPublishedRevisionByEntryIdUseCase`              | Get published revision              |
| `GetRevisionByIdUseCase`                            | Get revision by ID                  |
| `GetRevisionsByEntryIdUseCase`                      | Get all revisions of an entry       |
| `GetSingletonEntryUseCase`                          | Get singleton entry                 |
| `ListEntriesUseCase`                                | List entries (base)                 |
| `ListLatestEntriesUseCase`                          | List latest entries                 |
| `ListPublishedEntriesUseCase`                       | List published entries              |
| `ListDeletedEntriesUseCase`                         | List deleted entries                |
| `ValidateEntryUseCase`                              | Validate entry data                 |
| `CmsWhereMapper`                                    | Map CMS where conditions            |
| `CmsSortMapper`                                     | Map CMS sort conditions             |

### `webiny/api/cms/model`

| Abstraction           | Purpose                   |
| --------------------- | ------------------------- |
| `ModelFactory`        | Define CMS content models |
| `FieldType`           | Define custom field types |
| `CreateModelUseCase`  | Create a model            |
| `CreateModelFromUseCase` | Clone a model          |
| `UpdateModelUseCase`  | Update a model            |
| `DeleteModelUseCase`  | Delete a model            |
| `GetModelUseCase`     | Get model by ID           |
| `ListModelsUseCase`   | List all models           |

### `webiny/api/cms/group`

| Abstraction          | Purpose         |
| -------------------- | --------------- |
| `ModelGroupFactory`  | Define model groups |
| `CreateGroupUseCase` | Create a group  |
| `UpdateGroupUseCase` | Update a group  |
| `DeleteGroupUseCase` | Delete a group  |
| `ListGroupsUseCase`  | List all groups |
| `GetGroupUseCase`    | Get group by ID |

### `webiny/api/website-builder/nextjs`

| Abstraction   | Purpose                    |
| ------------- | -------------------------- |
| `NextjsConfig` | Configure Next.js integration |

### `webiny/api/website-builder/page`

| Abstraction                     | Purpose                            |
| ------------------------------- | ---------------------------------- |
| `CreatePageUseCase`             | Create a page                      |
| `CreatePageRevisionFromUseCase` | Create page revision from existing |
| `DeletePageUseCase`             | Delete a page                      |
| `DuplicatePageUseCase`          | Duplicate a page                   |
| `GetPageByIdUseCase`            | Get page by ID                     |
| `GetPageByPathUseCase`          | Get page by path                   |
| `GetPageRevisionsUseCase`       | Get page revisions                 |
| `ListPagesUseCase`              | List pages                         |
| `MovePageUseCase`               | Move a page                        |
| `PublishPageUseCase`            | Publish a page                     |
| `UnpublishPageUseCase`          | Unpublish a page                   |
| `UpdatePageUseCase`             | Update a page                      |

### `webiny/api/website-builder/redirect`

| Abstraction                       | Purpose                    |
| --------------------------------- | -------------------------- |
| `CreateRedirectUseCase`           | Create a redirect          |
| `DeleteRedirectUseCase`           | Delete a redirect          |
| `GetActiveRedirectsUseCase`       | Get active redirects       |
| `GetRedirectByIdUseCase`          | Get redirect by ID         |
| `InvalidateRedirectsCacheUseCase` | Invalidate redirects cache |
| `ListRedirectsUseCase`            | List redirects             |
| `MoveRedirectUseCase`             | Move a redirect            |
| `UpdateRedirectUseCase`           | Update a redirect          |

## Examples Across Extension Types

### API Extension (GraphQL Schema with DI)

GraphQL schemas use the **builder pattern**. The `execute` method receives a `builder` and uses `addTypeDefs` and `addResolver` to define the schema. Resolver-level DI is declared per-resolver via `dependencies` in `addResolver`, resolved at request time from the request-scoped container.

```typescript
import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { IdentityContext } from "webiny/api/security";

class WhoAmISchema implements GraphQLSchemaFactory.Interface {
  async execute(
    builder: GraphQLSchemaFactory.SchemaBuilder
  ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
    builder.addTypeDefs(/* GraphQL */ `
      extend type Query {
        whoAmI: String
      }
    `);

    builder.addResolver({
      path: "Query.whoAmI",
      dependencies: [IdentityContext],
      resolver: (identityContext: IdentityContext.Interface) => {
        return () => {
          const identity = identityContext.getIdentity();
          return `Hello, ${identity.displayName}!`;
        };
      }
    });

    return builder;
  }
}

export default GraphQLSchemaFactory.createImplementation({
  implementation: WhoAmISchema,
  dependencies: []
});
```

Note: `GraphQLSchemaFactory` implementations typically have `dependencies: []` because DI happens at the resolver level via `addResolver({ dependencies })`, not at the class constructor level.

### CLI Command with DI

```typescript
import { Ui } from "webiny/cli";
import { CliCommandFactory } from "webiny/cli/command";

class MyCommandImpl implements CliCommandFactory.Interface<{ name: string }> {
  constructor(private ui: Ui.Interface) {}

  execute(): CliCommandFactory.CommandDefinition<{ name: string }> {
    return {
      name: "greet",
      description: "Greet someone",
      params: [{ name: "name", description: "Name", type: "string" }],
      handler: async params => {
        this.ui.success(`Hello, ${params.name}!`);
      }
    };
  }
}

export default CliCommandFactory.createImplementation({
  implementation: MyCommandImpl,
  dependencies: [Ui]
});
```

### Pulumi Handler with DI

```typescript
import { Ui } from "webiny/infra";
import { CorePulumi } from "webiny/infra/core";

class MyPulumiImpl implements CorePulumi.Interface {
  constructor(private ui: Ui.Interface) {}

  execute(app: any) {
    this.ui.info("Deploying with environment:", app.env);
  }
}

export default CorePulumi.createImplementation({
  implementation: MyPulumiImpl,
  dependencies: [Ui]
});
```

## Key Rules

1. Always import from the **feature path**, not the package root.
2. Use `Feature.Interface` for constructor parameter types.
3. The `dependencies` array order must match the constructor parameter order.
4. Read the `abstractions.ts` file in the feature folder to see available methods.
5. Extensions with no dependencies use `dependencies: []`.

## Related Skills

- `custom-graphql-api` -- DI in GraphQL schema extensions
- `lifecycle-events` -- DI in lifecycle event handlers
- `cli-extensions` -- DI in CLI command extensions
