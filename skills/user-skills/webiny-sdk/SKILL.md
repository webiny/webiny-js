---
name: webiny-sdk
context: webiny-extensions
description: >
  Using @webiny/sdk to read and write CMS data from external applications.
  Use this skill when the developer is building a Next.js, Vue, Node.js, or any external app
  that needs to fetch or write content to Webiny, set up the SDK, use the Result pattern,
  list/get/create/update/publish entries, filter and sort queries, use TypeScript generics
  for type safety, work with the File Manager, list languages, or create API keys programmatically.
  Covers read vs preview mode, the `values` wrapper requirement, correct method names,
  and the `fields` required parameter. Also covers common SDK errors and troubleshooting
  — especially "Content model '<modelName>' not found" (which usually means the API key
  lacks permission, not that the model is missing) and the Website Builder starter
  pitfall of reusing NEXT_PUBLIC_WEBSITE_BUILDER_API_KEY for Headless CMS reads (that key
  has no CMS permissions by default and needs either extension or replacement with a
  CMS-scoped key).
---

# Webiny SDK

## TL;DR

The `@webiny/sdk` package provides a TypeScript interface for external apps (Next.js, Vue, Node.js) to interact with Webiny's Headless CMS and File Manager. Every method returns a `Result` object (checked with `isOk()`). Supports listing, getting, creating, updating, publishing, and unpublishing entries with filtering, sorting, pagination, and TypeScript generics for type safety.

## Installation & Setup

```bash
npm install @webiny/sdk
```

Initialize once and reuse:

```typescript
// lib/webiny.ts
import { Webiny } from "@webiny/sdk";

export const webiny = new Webiny({
  token: process.env.WEBINY_API_TOKEN!,
  endpoint: process.env.WEBINY_API_ENDPOINT!,
  tenant: process.env.WEBINY_API_TENANT || "root"
});
```

- `token` -- API key token generated in Webiny Admin (Settings > API Keys)
- `endpoint` -- The base API URL, **without a trailing slash**. Run `yarn webiny info` in your Webiny project to find the API URL. For Website Builder projects use `NEXT_PUBLIC_WEBSITE_BUILDER_API_HOST`.
- `tenant` -- Tenant ID, defaults to `"root"`

> **IMPORTANT:** Never add a trailing slash to `endpoint`. The SDK appends `/graphql` to the endpoint internally, so `https://xxx.cloudfront.net/` will break all requests.

## The `fields` Parameter (Required)

Every SDK method requires a `fields` array that specifies which fields to return. Omitting it will cause a runtime error.

- Use `"values.<fieldId>"` for content fields: `"values.name"`, `"values.price"`
- Use top-level field names for metadata: `"id"`, `"entryId"`, `"createdOn"`, `"status"`
- Use dot notation for nested fields: `"values.author.name"`

```typescript
// Minimal fields -- just IDs
fields: ["id", "entryId"];

// Content fields
fields: ["id", "entryId", "values.name", "values.price", "values.description"];

// Nested reference fields
fields: ["id", "values.title", "values.author.name", "values.author.email"];
```

## CMS: Read vs Preview Mode

`webiny.cms.listEntries` and `webiny.cms.getEntry` accept a `preview` parameter to control which revisions are returned:

| `preview`         | Returns                              | Use For                          |
| ----------------- | ------------------------------------ | -------------------------------- |
| `false` (default) | Published entries only               | Public-facing apps, SSG          |
| `true`            | Latest revision (draft or published) | Content preview, editorial tools |

Write operations (`createEntry`, `updateEntryRevision`, etc.) are not affected by `preview`.

## The Result Pattern

Every SDK method returns a `Result` object -- it never throws:

```typescript
const result = await webiny.cms.listEntries({
  modelId: "product",
  fields: ["id", "values.name"]
});

if (result.isOk()) {
  console.log(result.value.data); // success -- typed data
} else {
  console.error(result.error.message); // failure -- error info
}
```

## TypeScript Generics

Pass a type parameter for full type safety on `values`:

```typescript
import type { CmsEntryData } from "@webiny/sdk";

interface Product {
  name: string;
  price: number;
  sku: string;
  description: string;
  category?: CmsEntryData<ProductCategory>;
}

interface ProductCategory {
  name: string;
  slug: string;
}

const result = await webiny.cms.listEntries<Product>({
  modelId: "product",
  fields: ["id", "entryId", "values.name", "values.price", "values.sku"]
});

if (result.isOk()) {
  // result.value.data is CmsEntryData<Product>[]
  const products = result.value.data;
  // products[0].values.name -- fully typed
}
```

Reference fields like `category` are typed as `CmsEntryData<T>`, which wraps referenced entries with `id`, `entryId`, and `values`.

## Reading Data

### List Entries

```typescript
const result = await webiny.cms.listEntries<Product>({
  modelId: "product",
  fields: ["id", "entryId", "values.name", "values.price"],
  sort: { "values.name": "asc" },
  limit: 10
});
```

### List with Filters

```typescript
const result = await webiny.cms.listEntries<Product>({
  modelId: "product",
  fields: ["id", "entryId", "values.name", "values.price"],
  where: {
    "values.price_gte": 100,
    "values.name_contains": "Pro"
  },
  sort: { "values.price": "desc" }
});
```

### Filter Operators

| Operator       | Description        | Example                                      |
| -------------- | ------------------ | -------------------------------------------- |
| `_eq`          | Equals (default)   | `"values.status": "active"`                  |
| `_not`         | Not equals         | `"values.status_not": "archived"`            |
| `_contains`    | Contains substring | `"values.name_contains": "Pro"`              |
| `_startsWith`  | Starts with        | `"values.name_startsWith": "Web"`            |
| `_gt` / `_gte` | Greater than / >=  | `"values.price_gte": 100`                    |
| `_lt` / `_lte` | Less than / <=     | `"values.price_lt": 500`                     |
| `_in`          | In array           | `"values.status_in": ["active", "featured"]` |

### Sort Format

Sort is a `Record<string, "asc" | "desc">` object:

```typescript
sort: { "values.name": "asc" }     // alphabetical
sort: { "values.price": "desc" }   // highest price first
sort: { "values.createdOn": "desc" } // newest first
```

### Get Single Entry

Use `where` with either `id` (revision ID) or `entryId`:

```typescript
// By revision ID
const result = await webiny.cms.getEntry<Product>({
  modelId: "product",
  where: { id: "abc123#0001" },
  fields: ["id", "entryId", "values.name", "values.price"]
});

// By entry ID (gets latest published revision)
const result = await webiny.cms.getEntry<Product>({
  modelId: "product",
  where: { entryId: "abc123" },
  fields: ["id", "entryId", "values.name"]
});
```

### Preview Mode (Drafts)

Pass `preview: true` to `listEntries` or `getEntry` to access unpublished/draft content:

```typescript
const result = await webiny.cms.listEntries<Product>({
  modelId: "product",
  fields: ["id", "entryId", "values.name"],
  preview: true // returns drafts + published
});
```

## Writing Data

> **CRITICAL:** Content fields MUST be wrapped inside a `values` key in the `data` object. Passing fields directly (without `values`) will result in an empty or malformed entry.

### Create an Entry

```typescript
const result = await webiny.cms.createEntry({
  modelId: "contactSubmission",
  data: {
    values: {
      // ← REQUIRED: wrap all content fields in `values`
      name: "John Doe",
      email: "john@example.com",
      message: "Hello from the contact form!"
    }
  },
  fields: ["id", "entryId"]
});
```

### Update an Entry Revision

The method is `updateEntryRevision`, not `updateEntry`. Use `revisionId` (the full `entryId#revisionNumber`, e.g. `"abc123#0001"`):

```typescript
const result = await webiny.cms.updateEntryRevision({
  modelId: "product",
  revisionId: "abc123#0001", // ← note: revisionId, not id
  data: {
    values: {
      // ← REQUIRED: wrap fields in `values`
      price: 29.99
    }
  },
  fields: ["id", "entryId", "values.price"]
});
```

### Publish / Unpublish

The methods are `publishEntryRevision` and `unpublishEntryRevision`, not `publishEntry`/`unpublishEntry`. Both require `revisionId` and `fields`:

```typescript
await webiny.cms.publishEntryRevision({
  modelId: "product",
  revisionId: "abc123#0001",
  fields: ["id", "entryId", "status"]
});

await webiny.cms.unpublishEntryRevision({
  modelId: "product",
  revisionId: "abc123#0001",
  fields: ["id", "entryId", "status"]
});
```

### Delete an Entry Revision

```typescript
await webiny.cms.deleteEntryRevision({
  modelId: "product",
  revisionId: "abc123#0001",
  fields: []
});
```

## Languages

`webiny.languages.listLanguages()` returns all **enabled** languages — disabled languages are always filtered out server-side, so no filter parameter is needed.

```typescript
import type { Language } from "@webiny/sdk";

const result = await webiny.languages.listLanguages();

if (result.isOk()) {
  const languages: Language[] = result.value;
  // languages[0].code, .name, .direction, .isDefault
}
```

The `Language` type:

```typescript
interface Language {
  id: string;
  code: string; // e.g. "en-US"
  name: string; // e.g. "English (US)"
  direction?: "ltr" | "rtl";
  isDefault?: boolean;
}
```

## File Manager

```typescript
// List files
const files = await webiny.fileManager.listFiles({
  limit: 20,
  fields: ["id", "key", "name", "size", "type", "src"]
});

// Upload a file (returns presigned URL for direct S3 upload)
const uploaded = await webiny.fileManager.uploadFile({ file: myFile });
```

## Creating API Keys via Code

For programmatic access, create API keys as an extension:

```typescript
// extensions/MyApiKey.ts
import { ApiKeyFactory } from "webiny/api/security";

class MyApiKeyImpl implements ApiKeyFactory.Interface {
  execute(): ApiKeyFactory.Return {
    return [
      {
        name: "Universal API Key",
        slug: "universal-key",
        token: "wat_12345678",
        permissions: [{ name: "*" }]
      }
    ];
  }
}

export default ApiKeyFactory.createImplementation({
  implementation: MyApiKeyImpl,
  dependencies: []
});
```

Register (**YOU MUST include the `.ts` file extension in the `src` prop** — omitting it will cause a build failure):

```tsx
<Api.Extension src={"/extensions/MyApiKey.ts"} />
```

## SDK Modules Reference

| Module                 | Webiny App    | What You Can Do                                                       |
| ---------------------- | ------------- | --------------------------------------------------------------------- |
| `webiny.cms`           | Headless CMS  | List, get, create, update, publish, unpublish, delete entry revisions |
| `webiny.fileManager`   | File Manager  | List, upload, and manage files and folders                            |
| `webiny.tenantManager` | Multi-tenancy | Create, install, enable, disable tenants                              |
| `webiny.languages`     | Languages     | List enabled languages (id, code, name, direction, isDefault)         |

## Common Mistakes

| Mistake                     | Correct                                 |
| --------------------------- | --------------------------------------- |
| `data: { name: "..." }`     | `data: { values: { name: "..." } }`     |
| `updateEntry(...)`          | `updateEntryRevision(...)`              |
| `publishEntry(...)`         | `publishEntryRevision(...)`             |
| `unpublishEntry(...)`       | `unpublishEntryRevision(...)`           |
| `sort: ["values.name_ASC"]` | `sort: { "values.name": "asc" }`        |
| `getEntry({ id: "..." })`   | `getEntry({ where: { id: "..." } })`    |
| Omitting `fields`           | Always provide `fields: [...]`          |
| Trailing slash in endpoint  | Remove trailing slash from endpoint URL |

## Troubleshooting

The SDK's error messages describe the *server's* view of the world, which sometimes hides
the real cause. The patterns below have all bitten real projects — when you hit one of
these errors, walk through the checklist before assuming the schema or framework is at
fault.

### `"Content model '<modelName>' not found."`

This error literally means the **currently authenticated principal cannot see** a model
with that ID — not necessarily that the model is missing. There are three things to
check, in order:

1. **Does the model actually exist?** Open Webiny Admin → Headless CMS → Models and
   confirm the `modelId` matches exactly (case-sensitive — `productCategory`, not
   `ProductCategory` or `product-category`).
2. **Is the model published / not private?** A model that's only created in code but not
   yet deployed (or that's defined as `.private(...)` instead of `.public(...)`) will not
   be visible via the public Read API.
3. **Does the API key have permission to read this model?** This is by far the most
   common cause when the model clearly exists. The CMS returns "not found" rather than
   "forbidden" on purpose, so an attacker can't probe the schema with an unauthorized
   key. Open Settings → API Keys → *your key* and verify it has at least:
   - **Headless CMS** access (`cms.contentEntry`, `cms.contentModel`, etc.)
   - The relevant model group selected (or "All groups")
   - For private models: the matching `read` permission scope

   Fix: grant the missing permission to the key, save, and retry. No code change needed.

### Using the wrong API key (Website Builder key for Headless CMS reads)

The Website Builder starter ships with `NEXT_PUBLIC_WEBSITE_BUILDER_API_KEY`. That key
exists for the WB editor itself and, **by default, only has Website Builder permissions
— it has no access to any Headless CMS models.** Reusing it to power
`webiny.cms.listEntries(...)` from a Server Component is the most common cause of
"Content model not found" in WB projects, because to the CMS the request looks just like
an unauthorized one.

You have two ways to fix this:

1. **Recommended — use a separate, CMS-scoped API key.** Generate a new key in Webiny
   Admin (Settings → API Keys) granting only the CMS permissions the public site needs
   (typically read on the relevant model groups), expose it as a different env var, and
   pass it into the SDK:

   ```dotenv
   # .env
   NEXT_PUBLIC_WEBSITE_BUILDER_API_KEY=...    # for the WB editor only
   WEBINY_CMS_READ_TOKEN=...                  # for SDK calls from Server Components
   ```

   ```typescript
   // lib/webiny.ts
   import { Webiny } from "@webiny/sdk";

   export const webiny = new Webiny({
     token: process.env.WEBINY_CMS_READ_TOKEN!,            // ← NOT the WB key
     endpoint: process.env.NEXT_PUBLIC_WEBSITE_BUILDER_API_HOST!,
     tenant: process.env.NEXT_PUBLIC_WEBSITE_BUILDER_API_TENANT || "root"
   });
   ```

   Keeping read and editor permissions on separate keys is also better for revocation
   and the principle of least privilege.

2. **Less recommended — extend the existing WB key with CMS permissions.** Open the WB
   API key in Settings → API Keys and add the required Headless CMS permissions to it.
   This works, but the same token now controls both the editor and public reads, which
   makes scoping and rotation harder later.

> **Heads-up:** `NEXT_PUBLIC_*` env vars are inlined into the client bundle by Next.js.
> Anything you put behind that prefix is publicly visible. A read-only CMS token that's
> scoped to public content is fine to expose; an editor or write-capable token is not —
> for those, use a non-`NEXT_PUBLIC_` env var and only read it from Server Components or
> Route Handlers.

### Other quick-hit checks

- **`endpoint` has a trailing slash.** The SDK appends `/graphql` itself, so a trailing
  slash produces a malformed URL and every call fails. Strip it.
- **`tenant` is wrong.** In multi-tenant setups, the default `"root"` tenant won't see
  models defined under another tenant. Confirm the tenant ID matches the one that owns
  the model.
- **Wrong endpoint host.** WB projects sometimes have separate Admin and Read API
  hostnames. The SDK should always point at the **Read** API (the public CloudFront
  URL), not the Admin host.
- **`fields` parameter omitted.** This throws at request time with a different message,
  but if you see schema-level errors before any data comes back, double-check that every
  call passes a non-empty `fields: [...]`.

## Quick Reference

```
Install:          npm install @webiny/sdk
Import:           import { Webiny } from "@webiny/sdk";
Type import:      import type { CmsEntryData } from "@webiny/sdk";
Initialize:       new Webiny({ token, endpoint, tenant })
Result check:     result.isOk() -> result.value.data / result.error.message
API endpoint:     yarn webiny info (in your Webiny project) -- NO trailing slash
Preview mode:     pass preview: true to listEntries / getEntry
fields required:  every method needs a fields: string[] array
values wrapper:   createEntry/updateEntryRevision data must use { values: { ... } }
```

## Related Skills

- `webiny-api-cms-content-models` -- Define the models you query with the SDK
- `webiny-website-builder` -- Use the SDK inside Website Builder components to fetch CMS data
