# @webiny/cms-sdk

A standalone SDK for interacting with the Webiny Headless CMS API. This SDK provides a simple and intuitive interface for reading published content and managing CMS entries in any JavaScript or TypeScript environment, including Node.js and the browser.

Perfect for:
- **Public websites**: Read and display published content in Next.js, React, or any web application
- **Content management**: Create, update, publish, and manage CMS entries programmatically
- **Server-side rendering**: Fetch content during SSR/SSG for optimal performance
- **Headless applications**: Build custom frontends powered by Webiny CMS

## Installation

```bash
npm install @webiny/cms-sdk
# or
yarn add @webiny/cms-sdk
```

## Usage

### Initialize the SDK

```typescript
import { CmsSdk } from "@webiny/cms-sdk";

const sdk = new CmsSdk({
    apiToken: "your-api-token",
    apiHost: "https://api.webiny.com",
    apiTenant: "my-tenant"
});
```

Optionally, you can provide a custom fetch-compliant function:

```typescript
import axios from "axios";

const sdk = new CmsSdk({
    apiToken: "your-api-token",
    apiHost: "https://api.webiny.com",
    apiTenant: "my-tenant",
    fetch: async (url, options) => {
        const response = await axios({
            url,
            method: options.method,
            headers: options.headers,
            data: options.body
        });
        return {
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            json: async () => response.data
        };
    }
});
```

### Get Entry

```typescript
// With TypeScript type safety
interface ArticleValues {
    title: string;
    description: string;
    author: {
        name: string;
        email: string;
    };
}

const entry = await sdk.getEntry<ArticleValues>({
    modelId: "article",
    where: { id: "123456" },
    fields: ["title", "description", "author.name", "author.email"]
});

// Now entry.values is typed as ArticleValues
console.log(entry?.values?.title); // TypeScript knows this is a string
```

### List Entries

```typescript
interface ProductValues {
    name: string;
    sku: string;
    price: number;
}

const result = await sdk.listEntries<ProductValues>({
    modelId: "product",
    where: { category: "electronics" },
    sort: { savedOn: "asc" },
    limit: 10,
    fields: ["name", "sku", "price"]
});

// result.items is typed as CmsEntry<ProductValues>[]
result.items.forEach(item => {
    console.log(item.values?.name); // TypeScript knows this is a string
});

console.log(result.meta); // Pagination metadata
```

### Create Entry

```typescript
interface ArticleValues {
    title: string;
    content: string;
}

const newEntry = await sdk.createEntry<ArticleValues>({
    modelId: "article",
    values: {
        title: "My article",
        content: "Article content..."
    }
});

// newEntry is typed as CmsEntry<ArticleValues>
```

### Update Entry

```typescript
const updatedEntry = await sdk.updateEntry<ArticleValues>({
    modelId: "article",
    id: "123456#0002",
    values: {
        title: "My updated article",
        content: "Updated content..."
    }
});
```

### Delete Entry

```typescript
const deleted = await sdk.deleteEntry({
    modelId: "article",
    id: "123456#0002",
    permanent: true
});
```

### Publish Entry

```typescript
const publishedEntry = await sdk.publishEntry({
    modelId: "article",
    id: "123456#0002"
});
// Returns { id, entryId, ... } without values field
```

### Unpublish Entry

```typescript
const unpublishedEntry = await sdk.unpublishEntry({
    modelId: "article",
    id: "123456#0002"
});
// Returns { id, entryId, ... } without values field
```

### Preview Unpublished Content

```typescript
// Preview draft content before publishing
const draftEntry = await sdk.getEntry<ArticleValues>({
    modelId: "article",
    where: { id: "123456" },
    fields: ["title", "content"],
    preview: true  // Uses preview API for unpublished content
});

const draftEntries = await sdk.listEntries<ArticleValues>({
    modelId: "article",
    where: { status: "draft" },
    preview: true  // Access unpublished entries
});
```

## API Reference

### `CmsSdk`

The main SDK class.

#### Constructor

```typescript
new CmsSdk(config: CmsSdkConfig)
```

##### `CmsSdkConfig`

- `apiToken` (string): Your Webiny API token
- `apiHost` (string): Your Webiny API host (e.g., `https://api.webiny.com`)
- `apiTenant` (string): Your tenant identifier
- `fetch` (function, optional): Custom fetch-compliant function

#### Methods

All methods return a Promise and may throw errors if the operation fails. All methods (except `deleteEntry`) support generic type parameters for type-safe values.

##### `getEntry<TValues>(params: GetEntryParams): Promise<CmsEntry<TValues> | null>`

Retrieve a single entry with typed values.

##### `listEntries<TValues>(params: ListEntriesParams): Promise<ListEntriesResult<TValues>>`

List entries with optional filtering, sorting, and pagination. Returns typed entries.

##### `createEntry<TValues>(params: CreateEntryParams<TValues>): Promise<CmsEntry<TValues>>`

Create a new entry with typed values.

##### `updateEntry<TValues>(params: UpdateEntryParams<TValues>): Promise<CmsEntry<TValues>>`

Update an existing entry with typed values.

##### `deleteEntry(params: DeleteEntryParams): Promise<boolean>`

Delete an entry (soft delete by default, or permanent delete if specified).

##### `publishEntry(params: PublishEntryParams): Promise<CmsEntry>`

Publish an entry. Returns the entry with id and entryId (values field not included).

##### `unpublishEntry(params: UnpublishEntryParams): Promise<CmsEntry>`

Unpublish an entry. Returns the entry with id and entryId (values field not included).

## TypeScript Support

The SDK is written in TypeScript and provides full type safety. You can specify the shape of your entry values using generic type parameters:

```typescript
interface MyContentModel {
    title: string;
    description: string;
    publishDate: string;
    author: {
        name: string;
        email: string;
    };
}

// Type-safe operations
const entry = await sdk.getEntry<MyContentModel>({ ... });
const entries = await sdk.listEntries<MyContentModel>({ ... });
await sdk.createEntry<MyContentModel>({ values: { ... } });
```

## License

MIT
