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
import { Logger, BuildParams } from "webiny/api";

class MyImplementation implements SomeFactory.Interface {
  constructor(
    private logger: Logger.Interface,
    private buildParams: BuildParams.Interface
  ) {}

  execute(/* factory-specific params */) {
    this.logger.info("Doing something...");
    // buildParams.get() returns T | null — always account for null.
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

> **Event handlers** use the same `createImplementation` pattern but are not injectable dependencies.

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

## Advanced Dependency Options

The `dependencies` array supports three forms per entry:

| Form | Meaning |
|------|---------|
| `Abstraction` | Single required dependency (shorthand) |
| `[Abstraction, { optional: true }]` | Single optional dependency — injects `undefined` if not registered |
| `[Abstraction, { multiple: true }]` | Multi-injection — injects **all** registered implementations as `T[]` |
| `[Abstraction, { multiple: true, optional: true }]` | Multi-injection, optional — injects `undefined` if none registered (vs empty `[]` with just `multiple`) |

### Multi-injection (`{ multiple: true }`)

Use when a class needs all registered implementations of an abstraction. The container calls `resolveAll()` internally and injects the results as an array.

**Abstraction:**

```ts
interface IPageType {
    name: string;
    label: string;
    modify(form: IFormModel): void;
}

export const PageType = createAbstraction<IPageType>("PageType");

export namespace PageType {
    export type Interface = IPageType;
}
```

**Multiple implementations registered separately:**

```ts
// StaticPageType.ts
class StaticPageTypeImpl implements PageType.Interface {
    name = "static";
    label = "Static Page";
    modify(form: IFormModel) { /* no-op — base form is sufficient */ }
}

export const StaticPageType = PageType.createImplementation({
    implementation: StaticPageTypeImpl,
    dependencies: []
});

// ProductPageType.ts (in another package/extension)
class ProductPageTypeImpl implements PageType.Interface {
    name = "product";
    label = "Product Page";
    modify(form: IFormModel) {
        form.fields(fields => ({
            product: fields.select().label("Product").required("Product is required")
        }));
        form.field("title").disabled(true);
        form.field("path").disabled(true);
    }
}

export const ProductPageType = PageType.createImplementation({
    implementation: ProductPageTypeImpl,
    dependencies: []
});
```

**Consumer injects the array:**

```ts
class CreatePagePresenterImpl implements CreatePagePresenter.Interface {
    constructor(
        private factory: FormModelFactory.Interface,
        private pageTypes: PageType.Interface[],
        private modifiers: CreatePageFormModifier.Interface[]
    ) {}
}

export const CreatePagePresenter = PresenterAbstraction.createImplementation({
    implementation: CreatePagePresenterImpl,
    dependencies: [
        FormModelFactory,
        [PageType, { multiple: true }],
        [CreatePageFormModifier, { multiple: true }]
    ]
});
```

**Registration — each implementation is a separate `container.register()` call:**

```ts
export const CreatePageFeature = createFeature({
    name: "CreatePage",
    register(container) {
        container.register(StaticPageType);   // first PageType impl
        container.register(ProductPageType);  // second PageType impl
        container.register(CreatePagePresenter);
    }
});
```

When `CreatePagePresenter` is resolved, `pageTypes` receives `[StaticPageTypeImpl, ProductPageTypeImpl]` in registration order.

### Optional dependency (`{ optional: true }`)

Use when a dependency may not be registered. The container injects `undefined` instead of throwing.

```ts
class MyPresenterImpl {
    constructor(
        private required: RequiredService.Interface,
        private analytics: AnalyticsService.Interface | undefined
    ) {}
}

export const MyPresenter = Abstraction.createImplementation({
    implementation: MyPresenterImpl,
    dependencies: [
        RequiredService,
        [AnalyticsService, { optional: true }]
    ]
});
```

## Container API Reference

### Registration

| Method | Description |
|--------|-------------|
| `container.register(Impl)` | Register a class implementation. Returns `RegistrationBuilder` with `.inSingletonScope()`. Multiple registrations of the same abstraction accumulate — `resolve()` returns the last, `resolveAll()` returns all. |
| `container.registerInstance(Abstraction, instance)` | Register a pre-built instance (no constructor resolution). |
| `container.registerFactory(Abstraction, factory)` | Register a factory function. Called on every `resolve()`. |
| `container.registerDecorator(Decorator)` | Register a decorator that wraps resolved instances. Applied in registration order. |
| `container.registerComposite(Composite)` | Register a composite that aggregates all implementations behind a single `resolve()`. |

### Resolution

| Method | Description |
|--------|-------------|
| `container.resolve(Abstraction)` | Resolve single instance (last registered wins). Throws if not registered. |
| `container.resolveAll(Abstraction)` | Resolve all registered implementations as `T[]`. Returns empty array if none. |
| `container.createChildContainer()` | Create a child container that inherits parent registrations. |

### Lifetime Scopes

- **Transient** (default): New instance on every `resolve()`.
- **Singleton** (`.inSingletonScope()`): Cached after first resolution, one instance per container.

**Convention:** Use cases = transient. Repositories, gateways, services, registries = singleton.

### Decorators

Decorators wrap resolved instances. The decoratee is always the **last** constructor parameter. The `dependencies` array does NOT include the decoratee.

```ts
class LoggingServiceDecorator implements MyService.Interface {
    constructor(
        private logger: Logger.Interface,
        private decoratee: MyService.Interface  // LAST param — injected automatically
    ) {}

    execute() {
        this.logger.info("Before");
        this.decoratee.execute();
    }
}

export const MyServiceLoggingDecorator = MyService.createDecorator({
    decorator: LoggingServiceDecorator,
    dependencies: [Logger]  // decoratee is NOT listed
});

// Registration:
container.registerDecorator(MyServiceLoggingDecorator);
```

### Composites

Composites aggregate multiple implementations behind a single `resolve()` call. Created via `Abstraction.createComposite()`:

```ts
class AllValidatorsComposite implements Validator.Interface {
    constructor(private validators: Validator.Interface[]) {}

    validate(input: unknown) {
        for (const v of this.validators) v.validate(input);
    }
}

export const ValidatorComposite = Validator.createComposite({
    implementation: AllValidatorsComposite,
    dependencies: [[Validator, { multiple: true }]]
});

// Registration:
container.registerComposite(ValidatorComposite);
```

## Key Rules

1. Always import from the **feature path**, not the package root.
2. Use `Feature.Interface` for constructor parameter types.
3. The `dependencies` array order must match the constructor parameter order.
4. Read the `abstractions.ts` file in the feature folder to see available methods.
5. Extensions with no dependencies use `dependencies: []`.
6. `BuildParams.get<T>(name)` returns `T | null` — always type the receiving property/variable as nullable (e.g. `string | null`) and handle the `null` case.
7. **BuildParam declarations belong inside the extension's `Extension.tsx`**, not in `webiny.config.tsx`. Expose required params as React props on the extension component so the consumer decides where values come from (see `webiny-full-stack-architect` skill for the full pattern).
8. For multi-injection, type the constructor param as `T[]` and use `[Abstraction, { multiple: true }]` in the dependencies array.
9. Each implementation of a multi-bound abstraction is a separate `container.register()` call — they accumulate.

## Related Skills

- `webiny-custom-graphql-api` -- DI in GraphQL schema extensions
- `webiny-cli-extensions` -- DI in CLI command extensions
- `webiny-full-stack-architect` -- Full-stack extension skeleton and registration pattern
- `webiny-api-architect` -- API-side architecture using DI
- `webiny-admin-architect` -- Admin-side architecture using DI
