---
name: webiny-sdk
context: webiny-extensions
description: >
  Using @webiny/sdk to read and write CMS data from external applications.
  Use this skill when the developer is building a Next.js, Vue, Node.js, or any external app
  that needs to fetch or write content to Webiny, set up the SDK, use the Result pattern,
  list/get/create/update/publish entries, filter and sort queries, use TypeScript generics
  for type safety, work with the File Manager, or create API keys programmatically. Also
  covers the three API types (Read, Manage, Preview) and CmsEntryData typing.
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
import { Sdk } from "@webiny/sdk";

export const sdk = new Sdk({
    token: process.env.WEBINY_API_TOKEN!,
    endpoint: process.env.WEBINY_API_ENDPOINT!,
    tenant: process.env.WEBINY_API_TENANT || "root"
});
```

- `token` -- API key token generated in Webiny Admin (Settings > API Keys)
- `endpoint` -- The base CloudFront URL (e.g., `https://xxx.cloudfront.net`). Run `yarn webiny info` to find it.
- `tenant` -- Tenant ID, defaults to `"root"`

## The Three API Types

Webiny provides three separate GraphQL APIs:

| API | URL Path | Returns | Can Write | Use For |
|---|---|---|---|---|
| **Read** | `/cms/read` | Published entries only | No | Public-facing apps, SSG |
| **Manage** | `/cms/manage` | All revisions (drafts + published) | Yes | Admin tools, content creation |
| **Preview** | `/cms/preview` | Latest revisions (drafts + published) | No | Content preview |

The SDK automatically routes to the correct API based on the method:
- `listEntries`, `getEntry` -> Read API
- `createEntry`, `updateEntry`, `publishEntry`, `unpublishEntry` -> Manage API

## The Result Pattern

Every SDK method returns a `Result` object -- it never throws:

```typescript
const result = await sdk.cms.listEntries({ modelId: "product", fields: ["id"] });

if (result.isOk()) {
    console.log(result.value.data);    // success -- typed data
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

const result = await sdk.cms.listEntries<Product>({
    modelId: "product"
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
const result = await sdk.cms.listEntries<Product>({
    modelId: "product",
    sort: ["values.name_ASC"],
    limit: 10
});
```

### List with Filters

```typescript
const result = await sdk.cms.listEntries<Product>({
    modelId: "product",
    where: {
        "values.price_gte": 100,
        "values.name_contains": "Pro"
    },
    sort: ["values.price_DESC"]
});
```

### Filter Operators

| Operator | Description | Example |
|---|---|---|
| `_eq` | Equals (default) | `"values.status": "active"` |
| `_not` | Not equals | `"values.status_not": "archived"` |
| `_contains` | Contains substring | `"values.name_contains": "Pro"` |
| `_startsWith` | Starts with | `"values.name_startsWith": "Web"` |
| `_gt` / `_gte` | Greater than / >= | `"values.price_gte": 100` |
| `_lt` / `_lte` | Less than / <= | `"values.price_lt": 500` |
| `_in` | In array | `"values.status_in": ["active", "featured"]` |

### Sort Format

Sort strings follow the pattern `values.<fieldId>_ASC` or `values.<fieldId>_DESC`:

```typescript
sort: ["values.name_ASC"]          // alphabetical
sort: ["values.price_DESC"]         // highest price first
sort: ["values.createdOn_DESC"]     // newest first
```

### Get Single Entry

```typescript
const result = await sdk.cms.getEntry<Product>({
    modelId: "product",
    id: "abc123#0001"
});
```

### The `fields` Parameter

Control which fields are returned:

```typescript
const result = await sdk.cms.listEntries<Product>({
    modelId: "product",
    fields: ["id", "values.name", "values.price"]
});
```

When omitted, all fields are returned. The `depth` parameter (default: `1`) controls how deeply reference fields are resolved.

## Writing Data

### Create an Entry

```typescript
const result = await sdk.cms.createEntry({
    modelId: "contactSubmission",
    data: {
        name: "John Doe",
        email: "john@example.com",
        message: "Hello from the contact form!"
    }
});
```

### Update an Entry

```typescript
const result = await sdk.cms.updateEntry({
    modelId: "product",
    id: "abc123#0001",
    data: {
        price: 29.99
    }
});
```

### Publish / Unpublish

```typescript
await sdk.cms.publishEntry({ modelId: "product", id: "abc123#0001" });
await sdk.cms.unpublishEntry({ modelId: "product", id: "abc123#0001" });
```

## File Manager

```typescript
// List files
const files = await sdk.fileManager.listFiles({ limit: 20 });

// Upload a file
const uploaded = await sdk.fileManager.uploadFile({ file: myFile });
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

Register:

```tsx
<Api.Extension src={"/extensions/MyApiKey.ts"} />
```

## SDK Modules Reference

| Module | Webiny App | What You Can Do |
|---|---|---|
| `sdk.cms` | Headless CMS | List, get, create, update, publish, unpublish entries |
| `sdk.fileManager` | File Manager | List, upload, and manage files and folders |
| `sdk.websiteBuilder` | Website Builder | List and retrieve website builder content |

## Quick Reference

```
Install:        npm install @webiny/sdk
Import:         import { Sdk } from "@webiny/sdk";
Type import:    import type { CmsEntryData } from "@webiny/sdk";
Initialize:     new Sdk({ token, endpoint, tenant })
Result check:   result.isOk() -> result.value.data / result.error.message
API endpoint:   yarn webiny info (in your Webiny project)
```

## Related Skills

- `content-models` -- Define the models you query with the SDK
- `website-builder` -- Use the SDK inside Website Builder components to fetch CMS data
