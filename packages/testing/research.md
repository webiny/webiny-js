# Test Framework Design Research

## Correct Mental Model

**Applications** (api-core, cms, aco) define:

- Abstractions (interfaces)
- Use cases
- Domain logic
- **They don't know about DDB, ES, or any storage implementation**

**Storage packages** (api-core-ddb, api-core-ddb-es, cms-ddb-es) provide:

- Concrete implementations of storage abstractions
- Tagged with keywords in package.json for discovery

**Tests need**:

- The application features
- Storage implementations to be injected based on environment

## The Real Problem

The current `getPresets()` system works well for discovering storage implementations. The issue is:

1. It uses global state (`global.__storageOps`)
2. Storage registration happens **before** test container creation
3. Tests manually call `getStorageOps()` to retrieve them

## Proposed Solution: Bridge the Current System to DI

```typescript
// packages/testing-framework/src/TestContextBuilder.ts

class TestContextBuilder {
  private container: Container;
  private features: FeatureDefinition[] = [];
  private storageApps: string[] = [];

  withFeature(feature: FeatureDefinition) {
    this.features.push(feature);
    return this;
  }

  // Explicitly declare which storage apps are needed
  withStorage(...apps: string[]) {
    this.storageApps.push(...apps);
    return this;
  }

  async build() {
    // 1. Use existing preset system to discover storage implementations
    const { getPresets } = await import("@webiny/project-utils/testing/presets");

    // Build keyword queries for each storage app
    // E.g., ["@webiny/api-core", "storage-operations"] for api-core
    const keywordQueries = this.storageApps.map(app => [`@webiny/${app}`, "storage-operations"]);

    const presets = await getPresets(...keywordQueries);

    // 2. Execute preset setup files to get storage operations
    // Instead of calling setStorageOps(), these should return storage operations directly
    const storageOps = await this.loadStorageOperations(presets);

    // 3. Register storage operations in DI container
    for (const [appName, ops] of Object.entries(storageOps)) {
      // Register storage operations as instances in the container
      // Each app defines its own storage operations abstraction
      const abstraction = this.getStorageAbstraction(appName);
      this.container.registerInstance(abstraction, ops.storageOperations);

      // Register any plugins from storage
      if (ops.plugins) {
        // Handle plugins somehow...
      }
    }

    // 4. Register application features (they can now resolve storage from container)
    for (const feature of this.features) {
      feature.register(this.container);
    }

    return new TestContext(this.container);
  }
}
```

## Key Questions:

### 1. How do storage setup files provide operations?

Current way:

```typescript
// api-core-ddb/__tests__/__api__/setupFile.js
setStorageOps("apiCore", () => {
  return {
    storageOperations: createApiCoreDdb({ documentClient }),
    plugins: []
  };
});
```

Should it be:

```typescript
// Option A: Export a function
export function createStorageOperations() {
  return {
    storageOperations: createApiCoreDdb({ documentClient }),
    plugins: []
  };
}

// Option B: Export a feature that registers itself
export const ApiCoreStorageFeature = createFeature({
  name: "ApiCoreStorage",
  register(container) {
    container.registerInstance(
      ApiCoreStorageOperations,
      createApiCoreDdb({ documentClient: container.resolve(DynamoDbDocumentClient) })
    );
  }
});
```

### 2. What abstraction do storage operations register under?

```typescript
// Does api-core define this?
// packages/api-core/src/abstractions.ts
export const ApiCoreStorageOperations = createAbstraction<IApiCoreStorageOperations>(
  "ApiCoreStorageOperations"
);

// Then storage packages implement it:
// packages/api-core-ddb/src/index.ts
export function createApiCoreDdb(config): IApiCoreStorageOperations {
  // Implementation
}
```

### 3. How do we handle the "plugins" that storage operations return?

Currently storage operations can return `{ storageOperations, plugins }`. How should plugins be registered in a DI container world?

### 4. Should preset loading stay the same or change?

The current preset system with package.json keywords works. Should we:

- Keep it exactly as-is, just bridge to DI container?
- Modify it to return features instead of setup file paths?
- Something else?

## Example Usage (Desired API)

```typescript
// Basic usage pattern
const ctx = createTestContext()
  .withFeature(ApiCoreFeature)
  .withFeature(CmsFeature)
  .withMockTenant()
  .withMockSecurity({ permissions: [{ name: "*" }] })
  .build();

// (1) Resolve abstractions from container
const useCase = ctx.resolve(CreateApiKeyUseCase);

// (2) Invoke as Lambda handler
const response = await ctx.invoke({
  path: "/graphql",
  body: { query: CREATE_API_KEY, variables: {...} }
});
```
