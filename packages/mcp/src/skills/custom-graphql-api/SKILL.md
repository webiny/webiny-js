---
name: webiny-custom-graphql-api
description: >
  Adding custom GraphQL queries and mutations using GraphQLSchemaFactory.
  Use this skill when the developer wants to add custom GraphQL endpoints, create custom
  queries or mutations, add business logic to the API layer, build custom resolvers,
  or inject backend services (identity, tenancy, CMS use-cases) into their GraphQL schema.
  Covers the full pattern from simple queries to complex resolvers with dependency injection.
---

# Custom GraphQL API

## TL;DR

Add custom GraphQL queries and mutations using the `GraphQLSchemaFactory` pattern. Define `typeDefs` and `resolvers`, inject backend services (identity, tenancy, CMS use-cases) via constructor DI, and export with `GraphQLSchemaFactory.createImplementation()`. Register in `webiny.config.tsx` as `<Api.Extension>`.

## The GraphQLSchemaFactory Pattern

```typescript
// extensions/MyGraphQLSchema.ts
import { GraphQLSchemaFactory } from "webiny/api/graphql";

class SchemaImpl implements GraphQLSchemaFactory.Interface {
    execute(): GraphQLSchemaFactory.Return {
        return [
            {
                typeDefs: /* GraphQL */ `
                    type Query {
                        hello: String
                    }
                `,
                resolvers: {
                    Query: {
                        hello: () => "Hello, World!"
                    }
                }
            }
        ];
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: SchemaImpl,
    dependencies: []
});
```

Register in `webiny.config.tsx`:

```tsx
<Api.Extension src={"/extensions/MyGraphQLSchema.ts"} />
```

## Using Dependency Injection

Inject backend services to access user identity, tenant info, or CMS data:

```typescript
// extensions/MyGraphQLSchema.ts
import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { IdentityContext } from "webiny/api/security";

class SchemaImpl implements GraphQLSchemaFactory.Interface {
    constructor(private identityContext: IdentityContext.Interface) {}

    execute(): GraphQLSchemaFactory.Return {
        return [
            {
                typeDefs: /* GraphQL */ `
                    type Query {
                        whoAmI: String
                    }
                `,
                resolvers: {
                    Query: {
                        whoAmI: () => {
                            const identity = this.identityContext.getIdentity();
                            return `Hello, ${identity.displayName}!`;
                        }
                    }
                }
            }
        ];
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: SchemaImpl,
    dependencies: [IdentityContext]
});
```

## Injecting CMS Use-Cases

You can inject Headless CMS features to read/write content entries from within your custom resolvers:

```typescript
import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";

class SchemaImpl implements GraphQLSchemaFactory.Interface {
    constructor(
        private listEntries: ListLatestEntriesUseCase.Interface,
        private getModel: GetModelUseCase.Interface
    ) {}

    execute(): GraphQLSchemaFactory.Return {
        return [
            {
                typeDefs: /* GraphQL */ `
                    type ProductSummary {
                        totalCount: Int
                    }
                    type Query {
                        productSummary: ProductSummary
                    }
                `,
                resolvers: {
                    Query: {
                        productSummary: async () => {
                            const model = await this.getModel.execute("product");
                            const result = await this.listEntries.execute(model, {
                                limit: 1000
                            });
                            return { totalCount: result.items.length };
                        }
                    }
                }
            }
        ];
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: SchemaImpl,
    dependencies: [ListLatestEntriesUseCase, GetModelUseCase]
});
```

## Available Injectable Services

### Core Features

| Feature | Import Path | Purpose |
|---|---|---|
| `IdentityContext` | `"webiny/api/security"` | Access current user identity and permissions |
| `TenantContext` | `"@webiny/api-core/features/TenantContext"` | Access current tenant information |
| `EventPublisher` | `"@webiny/api-core/features/EventPublisher"` | Publish domain events |
| `WcpContext` | `"@webiny/api-core/features/WcpContext"` | Webiny Control Panel integration |
| `Logger` | `"webiny/api/logger"` | Logging (persists to CloudWatch) |
| `BuildParams` | `"webiny/api/buildParams"` | Access build-time parameters |

### Headless CMS Use-Cases

| Feature | Import Path | Purpose |
|---|---|---|
| `GetEntryByIdUseCase` | `"@webiny/api-headless-cms/features/contentEntry/GetEntryById"` | Fetch entry by exact revision ID |
| `GetEntryUseCase` | `"@webiny/api-headless-cms/features/contentEntry/GetEntry"` | Get entry by query (where + sort) |
| `ListLatestEntriesUseCase` | `"@webiny/api-headless-cms/features/contentEntry/ListEntries"` | List latest entries |
| `ListPublishedEntriesUseCase` | `"@webiny/api-headless-cms/features/contentEntry/ListEntries"` | List published entries |
| `CreateEntryUseCase` | `"@webiny/api-headless-cms/features/contentEntry/CreateEntry"` | Create a new entry |
| `UpdateEntryUseCase` | `"@webiny/api-headless-cms/features/contentEntry/UpdateEntry"` | Update an existing entry |
| `DeleteEntryUseCase` | `"@webiny/api-headless-cms/features/contentEntry/DeleteEntry"` | Delete an entry |
| `GetModelUseCase` | `"@webiny/api-headless-cms/features/contentModel/GetModel"` | Retrieve a content model by ID |
| `ListModelsUseCase` | `"@webiny/api-headless-cms/features/contentModel/ListModels"` | List all accessible models |

### Settings

| Feature | Import Path | Purpose |
|---|---|---|
| `GetSettings` | `"@webiny/api-core/features/settings/GetSettings"` | Retrieve settings by name |
| `UpdateSettings` | `"@webiny/api-core/features/settings/UpdateSettings"` | Create or update settings |

### Tenancy

| Feature | Import Path | Purpose |
|---|---|---|
| `GetTenantByIdUseCase` | `"@webiny/api-core/features/tenancy/GetTenantById"` | Fetch a tenant by ID |
| `CreateTenantUseCase` | `"@webiny/api-core/features/tenancy/CreateTenant"` | Create a new tenant |
| `UpdateTenantUseCase` | `"@webiny/api-core/features/tenancy/UpdateTenant"` | Update a tenant |
| `DeleteTenantUseCase` | `"@webiny/api-core/features/tenancy/DeleteTenant"` | Delete a tenant |

## Quick Reference

```
Import:       import { GraphQLSchemaFactory } from "webiny/api/graphql";
Interface:    GraphQLSchemaFactory.Interface
Return type:  GraphQLSchemaFactory.Return
Export:        GraphQLSchemaFactory.createImplementation({ implementation, dependencies })
Register:     <Api.Extension src={"/extensions/MyGraphQLSchema.ts"} />
Deploy:       yarn webiny deploy api
```

## Related Skills

- `dependency-injection` -- Full DI reference for all injectable services
- `project-structure` -- How to register extensions in `webiny.config.tsx`
