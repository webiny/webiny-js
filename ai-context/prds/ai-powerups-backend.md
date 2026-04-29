# AI Power-Ups Settings — Plugin Architecture PRD

## Summary

Introduce an extensible settings system for AI Power-Ups where plugins contribute self-contained settings groups (frontend form + backend handler + optional GraphQL mapper). Each plugin owns its section end-to-end: UI definition, validation, storage translation, and API-shape translation. The core stays schema-agnostic and routes by section name.

## Goals

- Plugins can register new settings groups without modifying core code.
- Internal, storage, and API shapes are cleanly separated per plugin.
- Secrets (e.g., API keys) never leak to the GraphQL API or logs.
- Full TypeScript safety across frontend form, backend handler, and consumer use cases.
- Programmatic updates (non-GraphQL) use the same pipeline as GraphQL mutations.

## Non-goals

- Partial/per-section saves. The entire settings object is always posted and persisted as one record.
- Per-plugin storage backends. All sections live in one DDB record.
- Cross-plugin validation rules. Plugins are independent.

---

## Architecture

### Layering

```
GraphQL Resolver  →  Use Case  →  Repository  →  Handler(s)
     ↕ Mapper        (policy)     (storage)     (shape xforms)
```

- **Resolver** — translates GraphQL ↔ internal via the plugin's `GraphQLMapper`. Never touches storage.
- **Use Case** — permissions, business rules, orchestration. Receives and returns fully-shaped `IAiPowerUpsSettings`.
- **Repository** — loads/saves the single DDB record. Drives handlers through `mapFromStorage` / `mapToStorage`. **Always receives the full `IAiPowerUpsSettings` object** on write; never accepts partial updates.
- **Handler** — pure shape transforms + input validation. No I/O.
- **GraphQL Mapper** — pure transport translation. No I/O. Optional per plugin.

### Augmented settings interface

```ts
// core
export interface IAiPowerUpsSettings {
  // plugins augment via declaration merging
}
```

Each plugin extends it:

```ts
declare module "@webiny/ai-powerups/api" {
  interface IAiPowerUpsSettings {
    providers: {
      presets: ProviderSettings[];
    };
  }
}
```

The augmented interface represents the **internal** shape — what use cases consume, containing ciphertext fields for secrets.

## Abstractions

Two DI abstractions, both keyed by section `name`:

### `AiPowerUps/SettingsGroup` (handler)

```ts
export interface IAiPowerUpsSettingsGroupHandler<
  TName extends keyof IAiPowerUpsSettings,
  TApiWrite
> {
  readonly name: TName;
  readonly inputSchema: ZodType<TApiWrite>;

  mapFromStorage(persisted: unknown): IAiPowerUpsSettings[TName];
  mapToStorage(
    internal: IAiPowerUpsSettings[TName],
    existing: IAiPowerUpsSettings[TName] | null
  ): Promise<unknown>;
}
```

- `inputSchema` — Zod schema for the GraphQL write shape. Core runs `parseAsync` before the pipeline continues.
- `mapFromStorage` — persisted → internal. Populates derived read-only fields (masks, ciphertext).
- `mapToStorage` — internal → persisted. Receives the previous internal state so it can enforce invariants (carry forward unchanged secrets, regenerate masks on change).

### `AiPowerUps/SettingsGroupGraphQLMapper` (mapper, optional)

```ts
export interface IAiPowerUpsSettingsGroupGraphQLMapper<
  TName extends keyof IAiPowerUpsSettings,
  TApiRead,
  TApiWrite
> {
  readonly name: TName;

  toApi(internal: IAiPowerUpsSettings[TName]): TApiRead | Promise<TApiRead>;
  fromApi(
    api: TApiWrite,
    existing: IAiPowerUpsSettings[TName] | null
  ): IAiPowerUpsSettings[TName] | Promise<IAiPowerUpsSettings[TName]>;
}
```

Plugins without transport translation needs (where internal shape is safe to expose directly) skip registering a mapper. The core treats absence as identity mapping.

---

## Secret handling

Secrets never traverse the GraphQL API in plaintext in either direction. The pattern for a secret field (e.g., `apiKey`):

### Internal shape (three slots)

```ts
interface ProviderSettings {
  id: string;
  name: string;
  model: string;
  description: string;
  apiKey?: string; // write-only input slot: mask (unchanged) or plaintext (new)
  apiKeyMasked: string; // read-only, populated by mapFromStorage
  apiKeyEncrypted: string; // read-only, available to consumers who decrypt
}
```

### `mapToStorage` decision matrix

| Incoming `apiKey`            | Action                                                |
| ---------------------------- | ----------------------------------------------------- |
| `undefined`                  | Leave alone — carry forward stored masked + encrypted |
| Equals stored `apiKeyMasked` | Unchanged — carry forward encrypted                   |
| Anything else                | New plaintext — encrypt + regenerate mask             |

### Consumption

Use cases that need the real key inject the encryption service themselves and decrypt `apiKeyEncrypted` at the point of use:

```ts
class SendPromptUseCase {
  constructor(
    private readonly settings: ISettingsReader,
    private readonly encryption: Encryption.Interface
  ) {}

  async execute() {
    const { providers } = await this.settings.get();
    const openai = providers.find(p => p.model.startsWith("gpt"));
    const apiKey = await this.encryption.decrypt(openai.apiKeyEncrypted);
    // ... use apiKey, scoped to this call
  }
}
```

Plaintext is never held on `IAiPowerUpsSettings` outside the brief write-path window.

### GraphQL exposure

`toApi` projects `apiKeyMasked` as the only form of the key exposed. `apiKeyEncrypted` is dropped. The GraphQL type has no `apiKeyEncrypted` field, so it can't leak even via a buggy resolver.

---

## Write pipeline (GraphQL mutation)

1. Resolver receives `ProvidersApiWrite` from the mutation argument.
2. Resolver loads current `IAiPowerUpsSettings` via `GetSettingsUseCase`.
3. For each plugin section: `mapper.fromApi(api, existing)` → new internal slice.
4. Resolver assembles full new `IAiPowerUpsSettings` and calls `UpdateSettingsUseCase`.
5. Use case checks permissions.
6. Use case calls `UpdateSettingsRepository` with the full object.
7. Repository, for each section: `handler.inputSchema.parseAsync` → `handler.mapToStorage(new, existing)` → persisted slice.
8. Repository merges all persisted slices into the DDB record, writes with optimistic lock.
9. Resolver calls `mapper.toApi` on the result to produce the mutation response.

## Read pipeline (GraphQL query)

1. Resolver calls `GetSettingsUseCase`.
2. Use case calls `GetSettingsRepository`.
3. Repository loads DDB record, runs `handler.mapFromStorage` per section.
4. Returns assembled `IAiPowerUpsSettings` to use case, then resolver.
5. Resolver calls `mapper.toApi` per section to produce the query response.

---

## Example: providers plugin

### Type augmentation

```ts
declare module "@core/settings-types" {
  interface IAiPowerUpsSettings {
    providers: ProviderSettings[];
  }
}
```

### Handler

```ts
class ProvidersHandler implements IAiPowerUpsSettingsGroupHandler<"providers", ProvidersApiWrite> {
  readonly name = "providers" as const;
  readonly inputSchema = z.object({
    /* ... */
  });

  constructor(
    private readonly encryption: Encryption.Interface,
    private readonly masker: ISecretMasker
  ) {}

  mapFromStorage(persisted: unknown): ProviderSettings[] {
    /* ... */
  }

  mapToStorage(internal, existing): Promise<unknown> {
    /* four-case logic */
  }
}
```

### GraphQL mapper

```ts
class ProvidersGraphQLMapper implements IAiPowerUpsSettingsGroupGraphQLMapper<
  "providers",
  ProvidersApiRead,
  ProvidersApiWrite
> {
  readonly name = "providers" as const;

  toApi(internal) {
    return {
      providers: internal.map(p => ({
        id: p.id,
        name: p.name,
        model: p.model,
        apiKey: p.apiKeyMasked ?? null
      }))
    };
  }

  fromApi(api) {
    return api.providers.map(p => ({ id: p.id, name: p.name, model: p.model, apiKey: p.apiKey }));
  }
}
```

---

## Implementation checklist

- [ ] Define `IAiPowerUpsSettings` base interface in `ai-powerups/src/api`
- [ ] Define both abstractions (`SettingsGroup`, `SettingsGroupGraphQLMapper`)
- [ ] Update `GetSettingsRepository` and `UpdateSettingsRepository` to process `IAiPowerUpsSettings` plugins
- [ ] Implement GraphQL resolver that orchestrates mapper ↔ use case
- [ ] Add optimistic locking (version field + conditional DDB write)
- [ ] Preserve unknown sections on write
- [ ] Implement providers plugin (handler, mapper, type augmentation, GraphQL schema contribution)
- [ ] `IMasker` as DI abstractions in `api-core` package:

```ts
export class Masker implements IMasker {
  mask(value: string): string {
    if (value.length <= 8) return "•".repeat(value.length);
    const prefix = value.slice(0, 8); // "sk-proj-", "sk-ant-", etc.
    const suffix = value.slice(-4);
    return `${prefix}${"•".repeat(12)}${suffix}`;
  }
}
```

- [ ] Wire DI registration for all of the above
