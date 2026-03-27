---
name: webiny-custom-graphql-api
context: webiny-extensions
description: >
  Adding custom GraphQL queries and mutations using GraphQLSchemaFactory.
  Use this skill when the developer wants to add custom GraphQL endpoints, create custom
  queries or mutations, add business logic to the API layer, build custom resolvers,
  or inject backend services (identity, tenancy, CMS use-cases) into their GraphQL schema.
  Covers the full pattern from simple queries to complex resolvers with dependency injection.
---

# Custom GraphQL API

## TL;DR

Add custom GraphQL queries and mutations using the `GraphQLSchemaFactory` builder pattern. Implement `GraphQLSchemaFactory.Interface`, use the builder to add type definitions and resolvers (with per-resolver DI), and export with `GraphQLSchemaFactory.createImplementation()`. Register as `<Api.Extension>`.

## The GraphQLSchemaFactory Pattern

The `execute` method receives a `builder` (`GraphQLSchemaBuilder.Interface`) and returns it after adding type defs and resolvers.

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

## Builder API Reference

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

Dependencies in `addResolver` are resolved at request time from the request-scoped container. This is different from class-level constructor DI -- it gives each resolver access to request-scoped services like identity and tenant context.

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

## Nested Mutation Pattern

For namespaced mutations (e.g. `mutation { tenantManager { installTenant } }`), add a pass-through resolver for the namespace type:

```typescript
import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { IdentityContext } from "webiny/api/security";
import { MyService } from "@/extensions/myFeature/MyFeature.js";

class OrderSchema implements GraphQLSchemaFactory.Interface {
  async execute(
    builder: GraphQLSchemaFactory.SchemaBuilder
  ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
    builder.addTypeDefs(/* GraphQL */ `
      type Order {
        id: ID!
        total: Float!
      }

      type OrderMutation {
        create(total: Float!): Order
      }

      extend type Mutation {
        orders: OrderMutation
      }
    `);

    // Pass-through resolver for the namespace
    builder.addResolver({
      path: "Mutation.orders",
      resolver: () => {
        return () => ({});
      }
    });

    // Actual mutation with DI
    builder.addResolver<{ total: number }>({
      path: "OrderMutation.create",
      dependencies: [IdentityContext, MyService],
      resolver: (identityContext: IdentityContext.Interface, myService: MyService.Interface) => {
        return async ({ args }) => {
          if (!identityContext.getPermission("orders.create")) {
            throw new Error("Not authorized");
          }
          return { id: "order-1", total: args.total };
        };
      }
    });

    return builder;
  }
}

export default GraphQLSchemaFactory.createImplementation({
  implementation: OrderSchema,
  dependencies: []
});
```

## Quick Reference

```
Import:       import { GraphQLSchemaFactory } from "webiny/api/graphql";
Interface:    GraphQLSchemaFactory.Interface
Builder:      GraphQLSchemaFactory.SchemaBuilder (param type for execute)
Return:       Promise<GraphQLSchemaFactory.SchemaBuilder>
Export:       GraphQLSchemaFactory.createImplementation({ implementation, dependencies })
Register:     <Api.Extension src={"@/extensions/mySchema/MyGraphQLSchema.ts"} />
Deploy:       yarn webiny deploy api --env=dev
```

## Related Skills

- `webiny-api-architect` -- Define custom abstractions, features, and services consumed by resolvers
- `webiny-dependency-injection` -- Full DI reference for all injectable services
- `webiny-project-structure` -- How to register extensions in `webiny.config.tsx`
