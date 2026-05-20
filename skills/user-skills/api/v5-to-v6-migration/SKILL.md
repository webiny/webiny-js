---
name: webiny-v5-to-v6-migration
context: webiny-api
description: >
  Migration patterns for converting v5 Webiny code to v6 architecture. Use this skill when
  migrating existing v5 plugins to v6 features, converting context plugins to DI services,
  adapting v5 event subscriptions to v6 EventHandlers, or understanding how v5 patterns
  translate to v6. Targeted at AI agents performing migrations.
---

# v5 → v6 Migration Patterns

## Overview

v6 replaces v5's plugin-based architecture with **feature-based DI**. The key shifts:

| v5 Concept                       | v6 Equivalent                                          |
| -------------------------------- | ------------------------------------------------------ |
| `ContextPlugin`                  | `createAbstraction` + `createImplementation` (Service) |
| Plugin array                     | `createFeature` + `container.register()`               |
| `context.myService`              | DI injection via constructor                           |
| `onEntryAfterCreate.subscribe()` | `EventHandler` feature                                 |
| `new GraphQLSchemaPlugin()`      | `GraphQLSchemaFactory.createImplementation()`          |

---

## Pattern 1: Context Plugin → DI Service

### v5

```typescript
new ContextPlugin(async context => {
  context.lingotekService = {
    translate: async (docId, locale) => {
      /* ... */
    },
    getStatus: async docId => {
      /* ... */
    },
    deleteProject: async projectId => {
      /* ... */
    }
  };
});
```

### v6

```typescript
// features/lingotekService/abstractions.ts
import { createAbstraction } from "webiny/api";

export interface ILingotekService {
  translate(docId: string, locale: string): Promise<Result<void, Error>>;
  getStatus(docId: string): Promise<Result<TranslationStatus, Error>>;
  deleteProject(projectId: string): Promise<Result<void, Error>>;
}

export const LingotekService = createAbstraction<ILingotekService>("MyExt/LingotekService");

export namespace LingotekService {
  export type Interface = ILingotekService;
}

// features/lingotekService/LingotekService.ts
class LingotekServiceImpl implements LingotekService.Interface {
  constructor(private buildParams: BuildParams.Interface) {}

  async translate(docId: string, locale: string) {
    /* ... */
  }
  async getStatus(docId: string) {
    /* ... */
  }
  async deleteProject(projectId: string) {
    /* ... */
  }
}

export default LingotekService.createImplementation({
  implementation: LingotekServiceImpl,
  dependencies: [BuildParams]
});

// features/lingotekService/feature.ts
export const LingotekServiceFeature = createFeature({
  name: "LingotekService",
  register(container) {
    container.register(LingotekServiceImpl).inSingletonScope();
  }
});
```

**Key difference:** v5 attaches to context object. v6 uses DI — consumers declare the service as a constructor dependency.

---

## Pattern 2: Event Subscription → EventHandler Feature

### v5

```typescript
context.cms.onEntryAfterCreate.subscribe(async params => {
  if (params.model.modelId !== "myModel") return;
  await doSomething(params.entry);
});
```

### v6

```typescript
// features/syncOnCreate/EntryAfterCreateHandler.ts
import { EntryAfterCreateEventHandler } from "webiny/api/cms/entry";
import { LingotekService } from "../lingotekService/abstractions.js";
import { MY_MODEL_ID } from "~/shared/constants.js";

class SyncOnCreateHandler implements EntryAfterCreateEventHandler.Interface {
  constructor(private lingotekService: LingotekService.Interface) {}

  async handle(event: EntryAfterCreateEventHandler.Event) {
    const { entry, model } = event.payload;
    if (model.modelId !== MY_MODEL_ID) return;
    await this.lingotekService.translate(entry.entryId, "en");
  }
}

export default EntryAfterCreateEventHandler.createImplementation({
  implementation: SyncOnCreateHandler,
  dependencies: [LingotekService]
});

// features/syncOnCreate/feature.ts
export const SyncOnCreateFeature = createFeature({
  name: "SyncOnCreate",
  register(container) {
    container.register(SyncOnCreateHandler);
  }
});
```

**Key differences:**

- Feature directory is named by **business capability** (`syncOnCreate`), not by event name
- Handler is a thin orchestrator — business logic lives in the injected service
- Must filter by `model.modelId` — handler fires for ALL models

---

## Pattern 3: Plugin Array → Feature Registration

### v5

```typescript
export default () => [
    new GraphQLSchemaPlugin({ ... }),
    new ContextPlugin(async ctx => { ... }),
    myModelPlugin,
    eventSubscriptionPlugin
];
```

### v6

```typescript
// api/Extension.ts
import { createFeature } from "webiny/api";

export const Extension = createFeature({
  name: "MyExtension",
  register(container) {
    container.register(MyModel);
    container.register(MyGraphQLSchema);
    SyncOnCreateFeature.register(container);
    LingotekServiceFeature.register(container);
  }
});
```

---

## Pattern 4: Async Service Bootstrap → ServiceProvider Pattern

When a v5 service was initialized with async data (loading settings, fetching config), v6 uses the **ServiceProvider** pattern — a provider abstraction with `async getService()` that lazily creates and caches the service.

See the **ServiceProvider Pattern** section in **webiny-api-architect** for the full pattern with abstractions, implementation, and consumer examples.

---

## Pattern 6: Permissions objects

### v5

```ts
[
  {
    name: "content.i18n",
    locales: ["en-US"]
  },
  {
    name: "cms.endpoint.read"
  },
  {
    name: "cms.endpoint.manage"
  },
  {
    name: "cms.endpoint.preview"
  },
  {
    name: "cms.contentModelGroup",
    groups: {
      "en-US": [LT_TRANSLATION_MODEL_GROUP_ID]
    },
    rwd: "rw",
    own: false,
    pw: ""
  },
  {
    name: "cms.contentModel",
    models: {
      "en-US": [
        LT_TRANSLATION_DOCUMENT_MODEL_ID,
        LT_CONFIG_MODEL_ID,
        LT_TRANSLATION_PROJECT_MODEL_ID
      ]
    },
    rwd: "rwd",
    own: false,
    pw: ""
  },
  {
    name: "cms.contentEntry",
    rwd: "rwd",
    own: false,
    pw: ""
  }
];
```

### v6

- `content.i18n` no longer exists
- locale codes no longer exist
- `models` is an array of `model.modelId` strings
- `groups` is an array of `group.slug` strings

```ts
[
  {
    name: "cms.endpoint.read"
  },
  {
    name: "cms.endpoint.manage"
  },
  {
    name: "cms.endpoint.preview"
  },
  {
    name: "cms.contentModelGroup",
    groups: ["LT_TRANSLATION_MODEL_GROUP_ID"],
    rwd: "rw",
    own: false,
    pw: ""
  },
  {
    name: "cms.contentModel",
    models: [
      "LT_TRANSLATION_DOCUMENT_MODEL_ID",
      "LT_CONFIG_MODEL_ID",
      "LT_TRANSLATION_PROJECT_MODEL_ID"
    ],
    rwd: "rwd",
    own: false,
    pw: ""
  },
  {
    name: "cms.contentEntry",
    rwd: "rwd",
    own: false,
    pw: ""
  }
];
```

---

## Type Resolution Guide

When working with Webiny abstractions, always verify types from source before writing code.

### Step 1: Find the catalog entry

Use MCP skills or generated catalogs to look up the abstraction (e.g., `RoleFactory`).

### Step 2: Get the source path

The catalog entry includes a `Source` field pointing to the abstraction definition.

### Step 3: Read the type definition

```bash
# Read the abstractions file
cat node_modules/@webiny/api-core/features/security/roles/shared/abstractions.d.ts
```

### Common type patterns

| Pattern       | What to expect                                     |
| ------------- | -------------------------------------------------- |
| Factories     | Return `Promise<Type[]>` or `Promise<Builder[]>`   |
| UseCases      | Have `Input` type and return `Result<Data, Error>` |
| EventHandlers | Have `Event` with `payload` property               |
| Repositories  | Return `Result<T, Error>` — wrap CMS errors        |

---

## Migration Map: v5 → v6 Equivalents

### Backend: Context Method Calls → Use Cases

| v5 Pattern                                | v6 Equivalent                            |
| ----------------------------------------- | ---------------------------------------- |
| `context.cms.getModel()`                  | `GetModelUseCase`                        |
| `context.cms.createModel()`               | `CreateModelUseCase`                     |
| `context.cms.updateEntry()`               | `UpdateEntryUseCase`                     |
| `context.cms.getSingletonEntryManager()`  | `GetSingletonEntryUseCase`               |
| `context.tenancy.getCurrentTenant()`      | `TenantContext.getTenant()`              |
| `context.security.withoutAuthorization()` | `IdentityContext.withoutAuthorization()` |
| `context.aco.folder.delete()`             | `DeleteFolderUseCase`                    |
| `context.aco.folder.get()`                | `GetFolderUseCase`                       |
| `context.plugins.register()`              | DI container registration                |
| `context.plugins.byType()`                | DI container injection                   |

### Backend: Lifecycle Event Subscriptions → EventHandlers

| v5 Pattern (`.subscribe()`)       | v6 EventHandler                    |
| --------------------------------- | ---------------------------------- |
| `cms.onEntryBeforeCreate`         | `EntryBeforeCreateEventHandler`    |
| `cms.onEntryAfterCreate`          | `EntryAfterCreateEventHandler`     |
| `cms.onEntryBeforeUpdate`         | `EntryBeforeUpdateEventHandler`    |
| `cms.onEntryAfterUpdate`          | `EntryAfterUpdateEventHandler`     |
| `cms.onEntryBeforeDelete`         | `EntryBeforeDeleteEventHandler`    |
| `cms.onEntryAfterDelete`          | `EntryAfterDeleteEventHandler`     |
| `cms.onEntryBeforeMove`           | `EntryBeforeMoveEventHandler`      |
| `cms.onEntryBeforePublish`        | `EntryBeforePublishEventHandler`   |
| `cms.onEntryBeforeUnpublish`      | `EntryBeforeUnpublishEventHandler` |
| `aco.folder.onFolderBeforeUpdate` | `FolderBeforeUpdateEventHandler`   |
| `aco.folder.onFolderAfterCreate`  | `FolderAfterCreateEventHandler`    |
| `aco.folder.onFolderAfterUpdate`  | `FolderAfterUpdateEventHandler`    |

### Backend: Plugin Classes → v6 Equivalents

| v5 Plugin                                       | v6 Equivalent                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ContextPlugin`                                 | DI-registered implementations                                                        |
| `createContextPlugin`                           | DI-registered implementations                                                        |
| `CmsModelPlugin`                                | `ModelFactory`                                                                       |
| `GraphQLSchemaPlugin`                           | `GraphQLSchemaFactory`                                                               |
| `createGraphQLSchemaPlugin`                     | `GraphQLSchemaFactory`                                                               |
| `createTaskDefinition`                          | `TaskDefinition`                                                                     |
| `CmsModelFieldToGraphQLPlugin`                  | `CmsModelFieldToGraphQL`                                                             |
| `createSecurityRolePlugin`                      | `RoleFactory`                                                                        |
| `createSecurityTeamPlugin`                      | `TeamFactory`                                                                        |
| `StorageTransformPlugin`                        | `StorageTransform`                                                                   |
| `createApiGatewayRoute`                         | `Api.Route` (`webiny.config.tsx`) and `Route.Interface` (imported from `webiny/api`) |
| `CmsModelFieldValidatorPlugin`                  | `CmsModelFieldValidator`                                                             |
| `createCmsGraphQLSchemaSorterPlugin`            | `CmsGraphQLSchemaSorter`                                                             |
| `createCmsEntryElasticsearchBodyModifierPlugin` | `CmsEntryOpenSearchBodyModifier`                                                     |

### Admin: React Plugins → AdminConfig API

| v5 Pattern                         | v6 Equivalent                                            |
| ---------------------------------- | -------------------------------------------------------- |
| `createComponentPlugin`            | `Component.createDecorator`                              |
| `RoutePlugin`                      | `<AdminConfig.Route/>`                                   |
| `AddMenu` / menu components        | `<AdminConfig.Menu/>`                                    |
| `HasPermission`                    | `HasPermission` or `createHasPermission` with new schema |
| `GraphQLPlaygroundTabPlugin`       | Not migratable.                                          |
| `CmsModelFieldTypePlugin`          | `<CmsModelFieldType/>`                                   |
| `CmsModelFieldRendererPlugin`      | `<CmsModelFieldRenderer/>`                               |
| `AdminAppPermissionRendererPlugin` | `createPermissionSchema` / `<Security.Permissions/>`     |
| `webiny/app/config`                | `EnvConfig`                                              |

---

## Common Migration Mistakes

### 1. Creating one abstraction per operation

v5 habit: separate plugins per action. v6: group related operations into a **multi-method Service**.

### 2. Naming features by technical event

v5 habit: thinking in terms of hooks (`onEntryAfterCreate`). v6: features describe business capability (`syncToLingotek`). Files inside can be named technically (`EntryAfterCreateHandler.ts`).

### 3. Assuming builder patterns

v6 factories sometimes return plain objects, sometimes builder objects. Always read source types first, to understand what the factory in question returns.

### 4. Putting event handlers in a handlers/ directory

v5 habit: grouping by type. v6: handlers are features — they go in `features/`.

### 5. Attaching to context

v5: `context.myService = { ... }`. v6: create an abstraction and register it in the DI container via the parent feature, or a standalone feature (`createFeature`).

### 6. Inline business logic in event handlers

v5 habit: putting logic directly in the subscription callback. v6: handlers are thin orchestrators — extract logic into a Service or UseCase.

## Pattern 7: CmsModelFieldToGraphQLPlugin → CmsModelFieldToGraphQL

### v5

```ts
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms";

new CmsModelFieldToGraphQLPlugin({
  fieldType: "myField",
  isSearchable: true,
  isSortable: false,
  read: {
    createTypeField({ field }) {
      return `${field.fieldId}: String`;
    },
    createListFilters({ field }) {
      return `${field.fieldId}: String`;
    }
  },
  manage: {
    createTypeField({ field }) {
      return `${field.fieldId}: String`;
    },
    createInputField({ field }) {
      return `${field.fieldId}: String`;
    }
  }
});
```

### v6

Import from `webiny/api/cms/graphql.js`. Implement `CmsModelFieldToGraphQL.Interface` — split read/manage into separate classes, export via `CmsModelFieldToGraphQL.createImplementation`, and register in a `createFeature` container.

```ts
import { createFeature } from "webiny/api";
import { CmsModelFieldToGraphQL } from "webiny/api/cms/graphql";

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
  createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
    return `${field.fieldId}: String`;
  }
  createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
    return `${field.fieldId}: String`;
  }
}

class ManageApi implements CmsModelFieldToGraphQL.ManageApi {
  createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
    return `${field.fieldId}: String`;
  }
  createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
    return `${field.fieldId}: String`;
  }
}

class MyFieldToGraphQL implements CmsModelFieldToGraphQL.Interface {
  public readonly fieldType = "myField";
  public readonly isSearchable = true;
  public readonly isSortable = false;
  public readonly isFullTextSearchable = false;
  public readonly read = new ReadApi();
  public readonly manage = new ManageApi();
  getReadApi() {
    return this.read;
  }
  getManageApi() {
    return this.manage;
  }
}

export const MyFieldToGraphQLImplementation = CmsModelFieldToGraphQL.createImplementation({
  implementation: MyFieldToGraphQL,
  dependencies: []
});

export const MyGraphQLFeature = createFeature({
  name: "MyApp/MyGraphQLFeature",
  register: container => {
    container.register(MyFieldToGraphQLImplementation);
  }
});
```

### Looking up a field handler by type

Use `CmsModelFieldToGraphQLRegistry` (also from `webiny/api/cms/graphql.js`) to retrieve any registered field handler by its `fieldType` string. Inject it as a dependency:

```ts
import { CmsModelFieldToGraphQL } from "webiny/api/cms/graphql";
import { CmsModelFieldToGraphQLRegistry } from "webiny/api/cms/graphql";

class MyFieldToGraphQL implements CmsModelFieldToGraphQL.Interface {
  constructor(private readonly registry: CmsModelFieldToGraphQLRegistry.Interface) {}

  // Example: delegate to another field's read API
  someMethod(fieldType: string) {
    const handler = this.registry.get(fieldType);
    // handler is CmsModelFieldToGraphQL.Interface | undefined
  }

  // ... rest of implementation
}

export const MyFieldToGraphQLImplementation = CmsModelFieldToGraphQL.createImplementation({
  implementation: MyFieldToGraphQL,
  dependencies: [CmsModelFieldToGraphQLRegistry]
});
```

`registry.getAll()` returns every registered handler when you need to iterate.

## Pattern 8: createCmsGraphQLSchemaSorterPlugin → CmsGraphQLSchemaSorter

### v5

```ts
import { createCmsGraphQLSchemaSorterPlugin } from "@webiny/api-headless-cms";

createCmsGraphQLSchemaSorterPlugin({
  sorter({ model, sorters }) {
    return [...sorters, `${model.singularApiName}CustomSort_ASC`];
  }
});
```

### v6

```ts
import { createFeature } from "webiny/api";
import { CmsGraphQLSchemaSorter } from "webiny/api/cms/graphql";

class MyCustomSorter implements CmsGraphQLSchemaSorter.Interface {
  execute({ model, sorters }: CmsGraphQLSchemaSorter.Params): string[] {
    return [...sorters, `${model.singularApiName}CustomSort_ASC`];
  }
}

export const MyCustomSorterImplementation = CmsGraphQLSchemaSorter.createImplementation({
  implementation: MyCustomSorter,
  dependencies: []
});

export const MySorterFeature = createFeature({
  name: "MyApp/MySorterFeature",
  register: container => {
    container.register(MyCustomSorterImplementation);
  }
});
```

## Pattern 9: StorageTransformPlugin → StorageTransform

### v5

```ts
import { StorageTransformPlugin } from "@webiny/api-headless-cms";

new StorageTransformPlugin({
  fieldType: "myField",
  async toStorage({ value }) {
    return serialize(value);
  },
  async fromStorage({ value }) {
    return deserialize(value);
  }
});
```

### v6

Import from `webiny/api/cms/storage.js`. Implement `StorageTransform.Interface` with `toStorage` and `fromStorage` async methods. Register in a `createFeature` container.

```ts
import { createFeature } from "webiny/api";
import { StorageTransform } from "webiny/api/cms/storage";

class MyStorageTransform implements StorageTransform.Interface {
  public readonly fieldType = "myField";

  async toStorage({ value }: StorageTransform.ToStorageParams): Promise<unknown> {
    return serialize(value);
  }

  async fromStorage({ value }: StorageTransform.FromStorageParams): Promise<unknown> {
    return deserialize(value);
  }
}

export const MyStorageTransformImpl = StorageTransform.createImplementation({
  implementation: MyStorageTransform,
  dependencies: []
});

export const MyStorageFeature = createFeature({
  name: "MyApp/MyStorageFeature",
  register: container => {
    container.register(MyStorageTransformImpl);
  }
});
```

Use `fieldType: "*"` for a catch-all transform that applies to all field types without a specific handler.

### Looking up a transform by type

Inject `StorageTransformRegistry` (also from `webiny/api/cms/storage.js`) to retrieve any registered transform:

```ts
import { StorageTransform } from "webiny/api/cms/storage";
import { StorageTransformRegistry } from "webiny/api/cms/storage";

class MyStorageTransform implements StorageTransform.Interface {
  constructor(private readonly registry: StorageTransformRegistry.Interface) {}

  async toStorage({ value, field }: StorageTransform.ToStorageParams): Promise<unknown> {
    const delegate = this.registry.get(field.type);
    // delegate is StorageTransform.Interface | undefined
  }
}

export const MyStorageTransformImpl = StorageTransform.createImplementation({
  implementation: MyStorageTransform,
  dependencies: [StorageTransformRegistry]
});
```

`registry.getAll()` returns every registered transform when you need to iterate.

## Pattern 10: CmsModelFieldValidatorPlugin → CmsModelFieldValidator

### v5

```ts
import { CmsModelFieldValidatorPlugin } from "@webiny/api-headless-cms";

new CmsModelFieldValidatorPlugin({
  validator: {
    name: "myValidator",
    async validate({ value, validator }) {
      if (!meetsCondition(value, validator.settings)) {
        throw new Error("Validation failed.");
      }
    }
  }
});
```

### v6

Import from `webiny/api/cms/validation.js`. Implement `CmsModelFieldValidator.Interface` with a `name` string and an async `validate` method that returns `boolean`. Register in a `createFeature` container.

```ts
import { createFeature } from "webiny/api";
import { CmsModelFieldValidator } from "webiny/api/cms/validation";

class MyValidatorImpl implements CmsModelFieldValidator.Interface {
  public readonly name = "myValidator";

  async validate({ value, validator }: CmsModelFieldValidator.Params): Promise<boolean> {
    return meetsCondition(value, validator.settings);
  }
}

export const MyValidator = CmsModelFieldValidator.createImplementation({
  implementation: MyValidatorImpl,
  dependencies: []
});

export const MyValidationFeature = createFeature({
  name: "MyApp/MyValidationFeature",
  register: container => {
    container.register(MyValidator);
  }
});
```

### Looking up a validator by name

Inject `CmsModelFieldValidatorRegistry` (also from `webiny/api/cms/validation.js`) to retrieve any registered validator:

```ts
import { CmsModelFieldValidator } from "webiny/api/cms/validation";
import { CmsModelFieldValidatorRegistry } from "webiny/api/cms/validation";

class MyValidatorImpl implements CmsModelFieldValidator.Interface {
  constructor(private readonly registry: CmsModelFieldValidatorRegistry.Interface) {}

  async validate({ value, validator }: CmsModelFieldValidator.Params): Promise<boolean> {
    const delegate = this.registry.get(validator.name);
    // delegate is CmsModelFieldValidator.Interface | undefined
    return true;
  }
}

export const MyValidator = CmsModelFieldValidator.createImplementation({
  implementation: MyValidatorImpl,
  dependencies: [CmsModelFieldValidatorRegistry]
});
```

`registry.getAll()` returns every registered validator when you need to iterate.

## Pattern 11: createCmsEntryElasticsearchBodyModifierPlugin → CmsEntryOpenSearchBodyModifier

Note: this abstraction lives in the `api-headless-cms-ddb-es` package (the DynamoDB + OpenSearch storage driver), not `api-headless-cms`. Only register it when that storage driver is in use.

### v5

```ts
import { createCmsEntryElasticsearchBodyModifierPlugin } from "@webiny/api-headless-cms-ddb-es";

createCmsEntryElasticsearchBodyModifierPlugin({
  modelId: "myModel", // optional — omit to apply to all models
  modifyBody({ body, model, where }) {
    body.query.bool.filter.push({ term: { tenant: where.tenant } });
  }
});
```

### v6

Import from `webiny/api/cms/opensearch.js`. Implement `CmsEntryOpenSearchBodyModifier.Interface` with a synchronous `modifyBody` method. The optional `modelId` property scopes the modifier to a single model; omit it to apply to all models.

```ts
import { createFeature } from "webiny/api";
import { CmsEntryOpenSearchBodyModifier } from "webiny/api/cms/opensearch";

class MyBodyModifier implements CmsEntryOpenSearchBodyModifier.Interface {
  public readonly modelId = "myModel"; // omit to apply to all models

  modifyBody({ body, model, where }: CmsEntryOpenSearchBodyModifier.Params): void {
    body.query.bool.filter.push({ term: { tenant: where.tenant } });
  }
}

export const MyBodyModifierImpl = CmsEntryOpenSearchBodyModifier.createImplementation({
  implementation: MyBodyModifier,
  dependencies: []
});

export const MyOpenSearchFeature = createFeature({
  name: "MyApp/MyOpenSearchFeature",
  register: container => {
    container.register(MyBodyModifierImpl);
  }
});
```

## Related Skills

- **webiny-api-architect** — Full v6 architecture, Services vs UseCases, anti-patterns
- **webiny-use-case-pattern** — UseCase implementation details
- **webiny-event-handler-pattern** — EventHandler and domain event patterns
- **webiny-dependency-injection** — DI pattern and injectable services
