---
name: webiny-api-graphql-catalog
context: webiny-api
description: >
  api/graphql — 7 abstractions.
---

# api/graphql

## How to Use

1. Find the abstraction you need in the table below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

| Class | Import | Source |
|-------|--------|--------|
| `ErrorResponse` | `webiny/api/graphql` | `@webiny/handler-graphql/responses.ts` |
| `GraphQLSchemaFactory` | `webiny/api/graphql` | `@webiny/handler-graphql/graphql/abstractions.ts` |
| `ListErrorResponse` | `webiny/api/graphql` | `@webiny/handler-graphql/responses.ts` |
| `ListResponse` | `webiny/api/graphql` | `@webiny/handler-graphql/responses.ts` |
| `NotAuthorizedResponse` | `webiny/api/graphql` | `@webiny/api-core/graphql/security/NotAuthorizedResponse.ts` |
| `NotFoundResponse` | `webiny/api/graphql` | `@webiny/handler-graphql/responses.ts` |
| `Response` | `webiny/api/graphql` | `@webiny/handler-graphql/responses.ts` |
