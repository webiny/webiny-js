# @webiny/cms-sdk

A standalone SDK for interacting with the Webiny Headless CMS API. This SDK provides a simple and intuitive interface for managing CMS content in any JavaScript or TypeScript environment, including Node.js and the browser.

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
const entry = await sdk.getEntry({
    modelId: "article",
    where: { id: "123456" },
    fields: ["title", "image", "author.id", "author.name", "author.company.name"]
});
```

### List Entries

```typescript
const result = await sdk.listEntries({
    modelId: "article",
    where: { category: "news" },
    sort: { savedOn: "asc" },
    limit: 10,
    include: ["image"]
});

console.log(result.items); // Array of entries
console.log(result.meta); // Pagination metadata
```

### Create Entry

```typescript
const newEntry = await sdk.createEntry({
    modelId: "article",
    values: {
        title: "My article"
    }
});
```

### Update Entry

```typescript
const updatedEntry = await sdk.updateEntry({
    modelId: "article",
    id: "123456#0002",
    values: {
        title: "My updated article"
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
```

### Unpublish Entry

```typescript
const unpublishedEntry = await sdk.unpublishEntry({
    modelId: "article",
    id: "123456#0002"
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

All methods return a Promise and may throw errors if the operation fails.

##### `getEntry(params: GetEntryParams): Promise<CmsEntry | null>`

Retrieve a single entry.

##### `listEntries(params: ListEntriesParams): Promise<ListEntriesResult>`

List entries with optional filtering, sorting, and pagination.

##### `createEntry(params: CreateEntryParams): Promise<CmsEntry>`

Create a new entry.

##### `updateEntry(params: UpdateEntryParams): Promise<CmsEntry>`

Update an existing entry.

##### `deleteEntry(params: DeleteEntryParams): Promise<boolean>`

Delete an entry (soft delete by default, or permanent delete if specified).

##### `publishEntry(params: PublishEntryParams): Promise<CmsEntry>`

Publish an entry.

##### `unpublishEntry(params: UnpublishEntryParams): Promise<CmsEntry>`

Unpublish an entry.

## License

MIT
