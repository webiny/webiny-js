---
name: webiny-api-graphql-catalog
context: webiny-api
description: >
  api/graphql — 7 abstractions.
---

# api/graphql

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Class:** `ErrorResponse`
**Import:** `webiny/api/graphql`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL error response helper.

---
**Class:** `GraphQLSchemaFactory`
**Import:** `webiny/api/graphql`
**Source:** `@webiny/handler-graphql/graphql/abstractions.ts`
**Description:** Define custom GraphQL schema extensions.

---
**Class:** `ListErrorResponse`
**Import:** `webiny/api/graphql`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL list error response helper.

---
**Class:** `ListResponse`
**Import:** `webiny/api/graphql`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL list response helper.

---
**Class:** `NotAuthorizedResponse`
**Import:** `webiny/api/graphql`
**Source:** `@webiny/api-core/graphql/security/NotAuthorizedResponse.ts`
**Description:** GraphQL not-authorized response helper.

---
**Class:** `NotFoundResponse`
**Import:** `webiny/api/graphql`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL not-found response helper.

---
**Class:** `Response`
**Import:** `webiny/api/graphql`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL response helper.

---
