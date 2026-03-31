---
name: webiny-custom-graphql-api
context: webiny-extensions
description: >
  Adding custom GraphQL queries and mutations using GraphQLSchemaFactory.
  Use this skill when the developer wants to add custom GraphQL endpoints, create custom
  queries or mutations, add business logic to the API layer, build custom resolvers,
  inject backend services (identity, tenancy, CMS use-cases) into their GraphQL schema,
  or build dynamic GraphQL inputs from CMS models. Covers the full pattern from simple
  queries to complex resolvers with dependency injection and permission transformers.
---

# Custom GraphQL API

## TL;DR

Add custom GraphQL queries and mutations using `GraphQLSchemaFactory`. Implement `GraphQLSchemaFactory.Interface`, use the schema builder to add type definitions and resolvers (with per-resolver DI), and export with `GraphQLSchemaFactory.createImplementation()`. Register as `<Api.Extension>`.

**YOU MUST include the full file path with the `.ts` extension in every `src` prop.** For example, use `src={"/extensions/MySchema.ts"}`, NOT `src={"/extensions/MySchema"}`. Omitting the file extension will cause a build failure.

**YOU MUST use `export default` for the `createImplementation()` call** when the file is targeted directly by an Extension `src` prop. Using a named export (`export const Foo = SomeFactory.createImplementation(...)`) will cause a build failure. Named exports are only valid inside files registered via `createFeature`.

## The GraphQLSchemaFactory Pattern

The `execute` method receives a schema builder and returns it after adding type defs and resolvers.

```typescript
// extensions/mySchema/MyGraphQLSchema.ts
import { GraphQLSchemaFactory } from "webiny/api/graphql";

class MySchema implements GraphQLSchemaFactory.Interface {
  async execute(
    builder: GraphQLSchemaFactory.SchemaBuilder
  ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
    builder.addTypeDefs(/* GraphQL */ `
      extend type Query {
        hello: String!
      }
    `);

    builder.addResolver({
      path: "Query.hello",
      resolver: () => {
        return () => "Hello, World!";
      }
    });

    return builder;
  }
}

export default GraphQLSchemaFactory.createImplementation({
  implementation: MySchema,
  dependencies: []
});
```

Register as an extension:

```tsx
// extensions/mySchema/Extension.tsx
import React from "react";
import { Api } from "webiny/extensions";

export const MySchema = () => {
  return <Api.Extension src={"@/extensions/mySchema/MyGraphQLSchema.ts"} />;
};
```

## Schema Builder API Reference

| Method                                  | Description                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `builder.addTypeDefs(typeDefs: string)` | Add GraphQL type definitions (use `extend type Query/Mutation` to add to existing root types) |
| `builder.addResolver<TArgs>(config)`    | Add a resolver with optional per-resolver DI dependencies                                     |

### `addResolver` Config

```typescript
builder.addResolver<TArgs>({
    path: "TypeName.fieldName",         // dot-separated path
    dependencies: [SomeAbstraction],    // optional: DI tokens resolved at request time
    resolver: (dep1, dep2, ...) => {    // factory: receives resolved deps
        return ({ parent, args, context, info }) => {
            // actual resolver logic
            return result;
        };
    }
});
```

Key points:

- **`path`**: Dot-separated GraphQL type path, e.g. `"Query.hello"`, `"Mutation.createOrder"`, `"OrderMutation.create"`
- **`dependencies`**: Array of DI abstraction tokens. Resolved **per-request** from `context.container`, not at schema build time
- **`resolver`**: A factory function that receives resolved dependencies and returns the actual resolver function
- **Resolver params**: The inner function receives `{ parent, args, context, info }` (named object, not positional)

## Per-Resolver Dependency Injection

Dependencies in `addResolver` are resolved at request time from the request-scoped container. This is different from class-level constructor DI — it gives each resolver access to request-scoped services like identity and tenant context.

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

---

## Query Schema with UseCase DI

Full pattern using `Response` / `ErrorResponse` wrappers and UseCase injection:

```typescript
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { GetCurrentEntityUseCase } from "../features/getCurrentEntity/abstractions.js";

class GetCurrentEntitySchema implements GraphQLSchemaFactory.Interface {
  async execute(
    builder: GraphQLSchemaFactory.SchemaBuilder
  ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
    builder.addTypeDefs(/* GraphQL */ `
      type EntityResponse {
        data: Entity
        error: Error
      }

      type Entity {
        id: ID!
        values: JSON!
      }

      type MyPackageQuery {
        getCurrentEntity: EntityResponse
      }

      extend type Query {
        myPackage: MyPackageQuery
      }
    `);

    // Pass-through resolver for the namespace
    builder.addResolver({
      path: "Query.myPackage",
      resolver: () => {
        return () => ({});
      }
    });

    builder.addResolver({
      path: "MyPackageQuery.getCurrentEntity",
      dependencies: [GetCurrentEntityUseCase],
      resolver: (getEntity: GetCurrentEntityUseCase.Interface) => {
        return async () => {
          const result = await getEntity.execute();
          if (result.isFail()) {
            return new ErrorResponse(result.error);
          }
          return new Response(result.value);
        };
      }
    });

    return builder;
  }
}

export default GraphQLSchemaFactory.createImplementation({
  implementation: GetCurrentEntitySchema,
  dependencies: []
});
```

---

## Namespaced Mutation Pattern

For namespaced mutations (e.g. `mutation { myPackage { createEntity } }`):

1. **One schema** defines the base namespace type + extends `Mutation`
2. **Other schemas** extend the namespace type

```typescript
// Schema 1: defines the namespace
builder.addTypeDefs(/* GraphQL */ `
  type MyPackageMutation {
    _empty: String
  }

  extend type Mutation {
    myPackage: MyPackageMutation
  }
`);

builder.addResolver({
  path: "Mutation.myPackage",
  resolver: () => {
    return () => ({});
  }
});

// Schema 2: extends the namespace
builder.addTypeDefs(/* GraphQL */ `
  extend type MyPackageMutation {
    disableEntity(entityId: ID!): BooleanResponse
  }
`);

builder.addResolver<{ entityId: string }>({
  path: "MyPackageMutation.disableEntity",
  dependencies: [DisableEntityUseCase],
  resolver: (disableEntity: DisableEntityUseCase.Interface) => {
    return async ({ args }) => {
      const result = await disableEntity.execute(args.entityId);
      if (result.isFail()) {
        return new ErrorResponse(result.error);
      }
      return new Response(true);
    };
  }
});
```

---

## Dynamic Input Fields from CMS Model

When GraphQL inputs must reflect CMS model fields (e.g., an extensible "extensions" object):

```typescript
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response, ErrorResponse } from "@webiny/handler-graphql";
import { PluginsContainer } from "@webiny/api-headless-cms/legacy/abstractions.js";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields.js";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { CreateEntityUseCase } from "../features/createEntity/abstractions.js";
import { ENTITY_MODEL_ID } from "~/shared/constants.js";

class CreateEntitySchema implements GraphQLSchemaFactory.Interface {
  constructor(
    private pluginsContainer: PluginsContainer.Interface,
    private listModelsUseCase: ListModelsUseCase.Interface
  ) {}

  async execute(
    builder: GraphQLSchemaFactory.SchemaBuilder
  ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
    const inputCreateFields = await this.getExtensionsInput();

    builder.addTypeDefs(/* GraphQL */ `
      ${inputCreateFields.map(f => f.typeDefs).join("\n")}

      input CreateEntityInput {
        id: ID
        name: String!
        description: String
        ${inputCreateFields.map(f => f.fields).join("\n")}
      }

      extend type MyPackageMutation {
        createEntity(input: CreateEntityInput!): BooleanResponse
      }
    `);

    builder.addResolver<{ input: CreateEntityUseCase.Input }>({
      path: "MyPackageMutation.createEntity",
      dependencies: [CreateEntityUseCase],
      resolver: (createEntity: CreateEntityUseCase.Interface) => {
        return async ({ args }) => {
          const result = await createEntity.execute(args.input);
          if (result.isFail()) {
            return new ErrorResponse(result.error);
          }
          return new Response(true);
        };
      }
    });

    return builder;
  }

  private async getExtensionsInput() {
    const fieldTypePlugins = createFieldTypePluginRecords(this.pluginsContainer);
    const modelsResult = await this.listModelsUseCase.execute({
      includePlugins: true,
      includePrivate: false
    });

    if (modelsResult.isFail()) {
      return [{ typeDefs: "", fields: "extensions: JSON" }];
    }

    const models = modelsResult.value;
    const model = models.find(m => m.modelId === ENTITY_MODEL_ID)!;

    return renderInputFields({
      models,
      model,
      fields: model.fields.filter(f => f.fieldId === "extensions"),
      fieldTypePlugins
    });
  }
}

// Note: constructor DI needed here because of PluginsContainer + ListModelsUseCase
export default GraphQLSchemaFactory.createImplementation({
  implementation: CreateEntitySchema,
  dependencies: [PluginsContainer, ListModelsUseCase]
});
```

---

## Permission Transformer (Adding CMS Permissions)

When your package needs CMS access, implement a `PermissionTransformer` to expand your custom permission into the required CMS permissions:

```typescript
// features/addCmsPermissions/AddCmsPermissions.ts
import { PermissionTransformer } from "@webiny/api-core/features/security/authorization/AuthorizationContext/abstractions.js";

class AddCmsPermissions implements PermissionTransformer.Interface {
  execute(permission: PermissionTransformer.Permission) {
    if (permission.name !== "mypackage.*") {
      return permission;
    }

    return [
      permission,
      { name: "cms.endpoint.manage" },
      { name: "cms.contentModel", own: false, rwd: "r", pw: "", models: ["myEntityModelId"] },
      { name: "cms.contentModelGroup", own: false, rwd: "r", pw: "", groups: ["hidden"] },
      { name: "cms.contentEntry", own: false, rwd: "rwd", pw: "" }
    ];
  }
}

export default PermissionTransformer.createImplementation({
  implementation: AddCmsPermissions,
  dependencies: []
});
```

---

## Key Rules

- Implement `GraphQLSchemaFactory.Interface`
- Use `builder.addTypeDefs()` for schema definitions and `builder.addResolver()` for resolvers
- Resolver `dependencies` array lists DI abstractions; resolver function receives resolved instances in same order
- Type the resolver args generic: `builder.addResolver<{ input: UseCaseAbstraction.Input }>`
- The root Query/Mutation types define a namespace type (e.g., `MyPackageQuery`, `MyPackageMutation`) extended by individual schemas
- Use `Response` for success, `ErrorResponse` for failure (from `@webiny/handler-graphql`)
- Export as `default`

## Quick Reference

```
Import:       import { GraphQLSchemaFactory } from "webiny/api/graphql";
Interface:    GraphQLSchemaFactory.Interface
Builder:      GraphQLSchemaFactory.SchemaBuilder (param type for execute)
Return:       Promise<GraphQLSchemaFactory.SchemaBuilder>
Export:       GraphQLSchemaFactory.createImplementation({ implementation, dependencies })
Register:     <Api.Extension src={"@/extensions/mySchema/MyGraphQLSchema.ts"} />
Deploy:       yarn webiny deploy api --env=dev
Response:     import { Response, ErrorResponse } from "@webiny/handler-graphql"
```

## Related Skills

- **webiny-api-architect** — Architecture overview, Services vs UseCases, feature naming, anti-patterns
- **webiny-use-case-pattern** — UseCase implementation consumed by GraphQL resolvers
- **webiny-dependency-injection** — Full DI reference for all injectable services
- **webiny-project-structure** — How to register extensions in `webiny.config.tsx`
