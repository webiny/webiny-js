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
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `ErrorResponse`
**Import:** `import { ErrorResponse } from "webiny/api/graphql"`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL error response helper.

---

**Name:** `GraphQLSchemaFactory`
**Import:** `import { GraphQLSchemaFactory } from "webiny/api/graphql"`
**Source:** `@webiny/handler-graphql/graphql/abstractions.ts`
**Description:** Define custom GraphQL schema extensions.

---

**Name:** `ListErrorResponse`
**Import:** `import { ListErrorResponse } from "webiny/api/graphql"`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL list error response helper.

---

**Name:** `ListResponse`
**Import:** `import { ListResponse } from "webiny/api/graphql"`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL list response helper.

---

**Name:** `NotAuthorizedResponse`
**Import:** `import { NotAuthorizedResponse } from "webiny/api/graphql"`
**Source:** `@webiny/api-core/graphql/security/NotAuthorizedResponse.ts`
**Description:** GraphQL not-authorized response helper.

---

**Name:** `NotFoundResponse`
**Import:** `import { NotFoundResponse } from "webiny/api/graphql"`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL not-found response helper.

---

**Name:** `Response`
**Import:** `import { Response } from "webiny/api/graphql"`
**Source:** `@webiny/handler-graphql/responses.ts`
**Description:** GraphQL response helper.

---
