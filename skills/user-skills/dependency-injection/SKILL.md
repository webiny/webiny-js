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

| Extension Type  | Factory                               | Import Path                    |
| --------------- | ------------------------------------- | ------------------------------ |
| Content Models  | `ModelFactory`                        | `"webiny/api/cms/model"`       |
| GraphQL Schemas | `GraphQLSchemaFactory`                | `"webiny/api/graphql"`         |
| CMS Entry Hooks | `EntryBeforeCreateEventHandler`, etc. | `"webiny/api/cms/entry"`       |
| API Key Hooks   | `ApiKeyAfterUpdateEventHandler`       | `"webiny/api/security/apiKey"` |
| API Keys        | `ApiKeyFactory`                       | `"webiny/api/security"`        |
| CLI Commands    | `CliCommandFactory`                   | `"webiny/cli/command"`         |
| Pulumi Handlers | `CorePulumi`                          | `"webiny/infra/core"`          |

## Injectable Services

### Utility Services

| Service       | Import                      | Interface               | Available In | Purpose                          |
| ------------- | --------------------------- | ----------------------- | ------------ | -------------------------------- |
| `Logger`      | `"webiny/api/logger"`       | `Logger.Interface`      | API          | Logging (persists to CloudWatch) |
| `BuildParams` | `"webiny/api/build-params"` | `BuildParams.Interface` | API          | Access build-time parameters     |
| `Ui` (CLI)    | `"webiny/cli"`              | `Ui.Interface`          | CLI          | Terminal output formatting       |
| `Ui` (Infra)  | `"webiny/infra"`            | `Ui.Interface`          | Infra        | Terminal output during deploy    |

### Logger Methods

```typescript
this.logger.info("Informational message");
this.logger.warn("Warning message");
this.logger.error("Error message");
this.logger.debug("Debug message");
```

### BuildParams Methods

```typescript
// Get a string parameter
const value = this.buildParams.get<string>("MY_PARAM");

// Get a complex parameter
const config = this.buildParams.get<{ myKey: number; nested: { foo: string } }>("MY_CONFIG");
```

Parameters are set in `webiny.config.tsx`:

```tsx
<Api.BuildParam paramName="MY_PARAM" value="customValue" />
<Api.BuildParam paramName="MY_CONFIG" value={{ myKey: 2, nested: { foo: "bar" } }} />
```

### Core Context Features

| Feature           | Import Path                                                              | Purpose                               |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------- |
| `IdentityContext` | `"webiny/api/security"` or `"@webiny/api-core/features/IdentityContext"` | Current user identity and permissions |
| `TenantContext`   | `"@webiny/api-core/features/TenantContext"`                              | Current tenant information            |
| `EventPublisher`  | `"@webiny/api-core/features/EventPublisher"`                             | Publish domain events                 |
| `WcpContext`      | `"@webiny/api-core/features/WcpContext"`                                 | Webiny Control Panel integration      |
| `GetSettings`     | `"@webiny/api-core/features/settings/GetSettings"`                       | Retrieve settings records             |
| `UpdateSettings`  | `"@webiny/api-core/features/settings/UpdateSettings"`                    | Create/update settings records        |

### Headless CMS Use-Cases

| Feature                       | Import Path                                                     | Purpose                      |
| ----------------------------- | --------------------------------------------------------------- | ---------------------------- |
| `GetEntryByIdUseCase`         | `"@webiny/api-headless-cms/features/contentEntry/GetEntryById"` | Fetch entry by revision ID   |
| `GetEntryUseCase`             | `"@webiny/api-headless-cms/features/contentEntry/GetEntry"`     | Get entry by query           |
| `ListLatestEntriesUseCase`    | `"@webiny/api-headless-cms/features/contentEntry/ListEntries"`  | List latest entries          |
| `ListPublishedEntriesUseCase` | `"@webiny/api-headless-cms/features/contentEntry/ListEntries"`  | List published entries       |
| `ListDeletedEntriesUseCase`   | `"@webiny/api-headless-cms/features/contentEntry/ListEntries"`  | List deleted entries         |
| `CreateEntryUseCase`          | `"@webiny/api-headless-cms/features/contentEntry/CreateEntry"`  | Create entry                 |
| `UpdateEntryUseCase`          | `"@webiny/api-headless-cms/features/contentEntry/UpdateEntry"`  | Update entry                 |
| `DeleteEntryUseCase`          | `"@webiny/api-headless-cms/features/contentEntry/DeleteEntry"`  | Delete entry                 |
| `GetModelUseCase`             | `"@webiny/api-headless-cms/features/contentModel/GetModel"`     | Get model by ID              |
| `ListModelsUseCase`           | `"@webiny/api-headless-cms/features/contentModel/ListModels"`   | List all models              |
| `GetModelRepository`          | `"@webiny/api-headless-cms/features/contentModel/GetModel"`     | Fetch model from cache       |
| `ListModelsRepository`        | `"@webiny/api-headless-cms/features/contentModel/ListModels"`   | Fetch all models from cache  |
| `ModelsFetcher`               | `"@webiny/api-headless-cms/features/contentModel/shared"`       | Centralized model fetching   |
| `ListEntriesRepository`       | `"@webiny/api-headless-cms/features/contentEntry/ListEntries"`  | Storage-level entry fetching |

### Tenancy Use-Cases

| Feature                | Import Path                                         | Purpose            |
| ---------------------- | --------------------------------------------------- | ------------------ |
| `GetTenantByIdUseCase` | `"@webiny/api-core/features/tenancy/GetTenantById"` | Fetch tenant by ID |
| `CreateTenantUseCase`  | `"@webiny/api-core/features/tenancy/CreateTenant"`  | Create a tenant    |
| `UpdateTenantUseCase`  | `"@webiny/api-core/features/tenancy/UpdateTenant"`  | Update a tenant    |
| `DeleteTenantUseCase`  | `"@webiny/api-core/features/tenancy/DeleteTenant"`  | Delete a tenant    |
| `InstallTenantUseCase` | `"@webiny/api-core/features/tenancy/InstallTenant"` | Install a tenant   |

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

### CMS Lifecycle Hook with DI

```typescript
import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

class MyHookImpl implements Handler.Interface {
  constructor(private logger: Logger.Interface) {}

  async handle(event: Handler.Event): Promise<void> {
    this.logger.info(`Entry created for model: ${event.modelId}`);
  }
}

export default Handler.createImplementation({
  implementation: MyHookImpl,
  dependencies: [Logger]
});
```

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
