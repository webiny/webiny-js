# AI Power-Ups Settings — Backend Implementation Plan

## Overview

Refactor the ai-powerups API settings system from a monolithic, hardcoded `providers` shape into an extensible plugin architecture. Plugins contribute self-contained settings groups (handler + optional GraphQL mapper) that own validation, storage transformation, and secret handling for their section. The core stays schema-agnostic and routes by section name.

## Decisions

These decisions were resolved during the grill session and apply across all phases.

**Backend only.** The frontend plan already exists and is implemented. This plan covers `ai-powerups/src/api/` and the `Masker` abstraction in `api-core`.

**`IAiPowerUpsSettings` base interface** lives in `api/types.ts`. Empty interface, plugins augment via declaration merging.

**Abstraction naming** is explicit: `AiPowerUpsSettingsGroupHandler`, `AiPowerUpsSettingsGroupGraphQLMapper`.

**Shared abstractions** live in `api/features/shared/abstractions.ts`.

**Handler abstraction is non-generic.** Uses `string` for name and `unknown` for section data. Implementations narrow types internally.

**`inputSchema` validates the internal shape** (post-mapper). Validation runs in the repository — the single chokepoint for both GraphQL and programmatic paths.

**Encryption is the handler's responsibility.** Only the handler knows which fields are secrets. The repository never touches encryption.

**`mapFromStorage` does not decrypt.** It populates `apiKeyEncrypted` (raw from storage) and `apiKeyMasked` (derived). Decryption happens at point of use (e.g., `WbGeneratePageContentUseCase`).

**GraphQL mapper orchestration** lives in the resolver. No separate orchestrator class.

**Write pipeline: resolver assembles the full object.** Loads current settings, overlays only sections present in the mutation input (via mapper or identity), passes the complete `IAiPowerUpsSettings` to the use case.

**No optimistic locking.** No version field, no conditional writes.

**Preserve unknown sections on write.** The repository merges handler output over the raw stored record. Sections without a handler pass through untouched.

**`Masker`** is a full DI abstraction in `api-core` (not local to ai-powerups).

**No permission checks** for now. Skipped on both read and write.

**Domain events survive.** `BeforeUpdate` and `AfterUpdate` events fire in the use case. Both carry `IAiPowerUpsSettings` (internal shape).

**GraphQL stays `JSON` scalars.** No per-plugin typed GraphQL types.

**Presets have an `id` field.** Generated on the frontend. Used by the handler to match incoming vs existing for secret handling.

**Error handling: fail-all.** If any handler's validation fails, the entire write fails. All errors collected and returned.

**`description` field** on presets remains optional in the backend schema.

**Plugin structure:** `features/providers/`, `features/personas/`, etc. Each has a `feature.ts` that registers everything.

---

## Phase 1: Masker Abstraction in `api-core`

Add a reusable secret-masking DI abstraction to `api-core`.

**Location:** `packages/api-core/src/features/masker/`

### Files

| File              | Responsibility                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `abstractions.ts` | `IMasker` interface: `mask(value: string): string`. `Masker` DI abstraction via `createAbstraction("Masker")`.                |
| `Masker.ts`       | Default implementation. Short values (≤8 chars): all dots. Longer: preserve first 8 chars + last 4 chars, 12 dots in between. |
| `feature.ts`      | `MaskerFeature` — registers the implementation.                                                                               |
| `index.ts`        | Re-exports.                                                                                                                   |

### Masking logic

```ts
mask(value: string): string {
    if (value.length <= 8) return "•".repeat(value.length);
    const prefix = value.slice(0, 8);
    const suffix = value.slice(-4);
    return `${prefix}${"•".repeat(12)}${suffix}`;
}
```

### Wire into api-core

Register `MaskerFeature` in the appropriate api-core extension point so it's available to all API features.

### End state

`Masker` is injectable anywhere in the API layer. No consumers yet — the providers handler (Phase 4) will be the first.

---

## Phase 2: Core Abstractions + Refactored Types

Define the plugin extension points and update the settings type system.

**Location:** `packages/ai-powerups/src/api/`

### Updated `IAiPowerUpsSettings`

`api/types.ts`:

Replace the hardcoded `AiPowerUpsSettings` interface with an empty interface that plugins augment:

```ts
export interface IAiPowerUpsSettings {
  // Plugins augment via declaration merging.
}
```

Remove the old `AiProvider` and `AiPowerUpsSettings` types.

### Shared abstractions

`api/features/shared/abstractions.ts`:

**`AiPowerUpsSettingsGroupHandler`:**

```ts
interface IAiPowerUpsSettingsGroupHandler {
  readonly name: string;
  readonly inputSchema: ZodType<unknown>;
  mapFromStorage(persisted: unknown): unknown;
  mapToStorage(internal: unknown, existing: unknown | null): Promise<unknown>;
}
```

DI abstraction via `createAbstraction("AiPowerUpsSettingsGroupHandler")`.

**`AiPowerUpsSettingsGroupGraphQLMapper`:**

```ts
interface IAiPowerUpsSettingsGroupGraphQLMapper {
  readonly name: string;
  toApi(internal: unknown): unknown | Promise<unknown>;
  fromApi(api: unknown, existing: unknown | null): unknown | Promise<unknown>;
}
```

DI abstraction via `createAbstraction("AiPowerUpsSettingsGroupGraphQLMapper")`.

### End state

The two extension points exist as DI abstractions. No implementations yet. The `IAiPowerUpsSettings` interface is empty, ready for augmentation.

---

## Phase 3: Refactor GetSettings + UpdateSettings Repositories

Update both repositories to use the handler pipeline instead of hardcoded logic.

**Location:** `packages/ai-powerups/src/api/features/`

### GetSettingsRepository

`features/GetSettings/GetSettingsRepository.ts`:

**Dependencies:** `KeyValueStore`, `[AiPowerUpsSettingsGroupHandler, { multiple: true }]`

Remove `Encryption` dependency — decryption is now the handler's job.

**Flow:**

1. Load raw record from `KeyValueStore` using `AI_POWER_UPS_SETTINGS` key.
2. If not found, raw = `{}`.
3. For each registered handler: call `handler.mapFromStorage(raw[handler.name])` (passes `undefined` if section missing). Assign result to `result[handler.name]`.
4. For keys in the raw record with no handler: copy to result as-is (preserve unknown sections).
5. Return assembled `IAiPowerUpsSettings`.

### UpdateSettingsRepository

`features/UpdateSettings/UpdateSettingsRepository.ts`:

**Dependencies:** `KeyValueStore`, `[AiPowerUpsSettingsGroupHandler, { multiple: true }]`

Remove `Encryption` dependency.

**Flow:**

1. Load current raw record from `KeyValueStore`. If not found, raw = `{}`.
2. Build current internal shape by running `handler.mapFromStorage(raw[handler.name])` per handler (for the `existing` parameter).
3. For each handler:
   a. Validate: `handler.inputSchema.parseAsync(newSettings[handler.name])`. If any handler fails, collect errors and abort — no write happens.
   b. Transform: `await handler.mapToStorage(newSettings[handler.name], existingInternal[handler.name])`. Assign to persisted record.
4. Merge handler output over the raw record (preserves unknown sections).
5. Write merged record to `KeyValueStore`.
6. Build and return the new internal shape by running `mapFromStorage` per handler on the freshly written record.

### UpdateSettingsUseCase

`features/UpdateSettings/UpdateSettingsUseCase.ts`:

- Remove inline Zod validation (`updateValidation.safeParse`) — validation is now per-handler in the repository.
- Keep domain event publishing (`BeforeUpdate` / `AfterUpdate`). Both payloads carry `IAiPowerUpsSettings` (internal shape).
- `BeforeUpdate` fires with the input (what's about to be saved).
- `AfterUpdate` fires with the repository's return value (post-save internal shape).

### UpdateSettings validation.ts

Delete `features/UpdateSettings/validation.ts` — validation moves into per-handler `inputSchema`.

### End state

Both repositories are schema-agnostic. They iterate handlers for all shape transformations. No encryption or validation logic in core code. Domain events still fire.

---

## Phase 4: Providers Plugin

Implement the first (and currently only) settings group plugin.

**Location:** `packages/ai-powerups/src/api/features/providers/`

### Type augmentation

```ts
declare module "@webiny/ai-powerups/api" {
  interface IAiPowerUpsSettings {
    providers: {
      presets: ProviderPreset[];
    };
  }
}

interface ProviderPreset {
  id: string;
  name: string;
  description?: string;
  model: string;
  apiKey?: string; // write-only input slot
  apiKeyMasked: string; // read-only, populated by mapFromStorage
  apiKeyEncrypted: string; // read-only, for consumers who decrypt at point of use
}
```

### Handler

`features/providers/ProvidersHandler.ts`:

**Dependencies:** `Encryption`, `Masker`

**`inputSchema`** (Zod, validates internal shape):

```ts
z.object({
  presets: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      model: z.string().min(1),
      apiKey: z.string().optional()
    })
  )
});
```

Note: `apiKey` is optional on the internal write shape — it may be `undefined` (carry forward) or the masked string (unchanged).

**`mapFromStorage(persisted)`:**

- If `persisted` is `undefined`/`null`: return `{ presets: [] }`.
- For each preset in `persisted.presets`:
  - `apiKeyMasked`: derive via `this.masker.mask(decryptedKey)` — but we don't decrypt. Actually: the stored value is the encrypted key. The mask needs to be derived from... the original plaintext? No — we store the mask alongside.

**Revised storage shape** (what's actually in DDB per preset):

```ts
{
    id: string;
    name: string;
    description?: string;
    model: string;
    apiKeyEncrypted: string;
    apiKeyMasked: string;
}
```

Both `apiKeyEncrypted` and `apiKeyMasked` are persisted. `mapFromStorage` just maps them to the internal shape directly. No encryption/decryption on read.

**`mapToStorage(internal, existing)`:**

For each preset in `internal.presets`, match against `existing.presets` by `id`:

| Incoming `apiKey`                       | Action                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `undefined` or absent                   | Carry forward `apiKeyEncrypted` + `apiKeyMasked` from existing match                   |
| Equals `apiKeyMasked` of existing match | Unchanged — carry forward `apiKeyEncrypted` + `apiKeyMasked`                           |
| Anything else                           | New plaintext — `encrypt(apiKey)` → `apiKeyEncrypted`, `mask(apiKey)` → `apiKeyMasked` |
| No existing match (new preset)          | Must have `apiKey` — encrypt + mask                                                    |

Returns array of persisted-shape objects (without the `apiKey` input slot).

### GraphQL Mapper

`features/providers/ProvidersGraphQLMapper.ts`:

**`toApi(internal)`:**

```ts
{
  presets: internal.presets.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    model: p.model,
    apiKey: p.apiKeyMasked ?? null
  }));
}
```

Strips `apiKeyEncrypted`. Exposes masked key as `apiKey`.

**`fromApi(api, existing)`:**

```ts
{
  presets: api.presets.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    model: p.model,
    apiKey: p.apiKey
  }));
}
```

Passes `apiKey` through as-is (could be masked string, new plaintext, or undefined).

### Feature registration

`features/providers/feature.ts`:

- Registers `ProvidersHandler` as `AiPowerUpsSettingsGroupHandler`
- Registers `ProvidersGraphQLMapper` as `AiPowerUpsSettingsGroupGraphQLMapper`

### Wire into Extension.ts

`api/Extension.ts`:

- Import and register `ProvidersFeature`

### End state

The providers plugin owns its entire settings lifecycle: validation, encryption, masking, storage mapping, and API mapping. Core code never touches provider-specific logic.

---

## Phase 5: Refactor GraphQL Resolver

Update the resolver to use the mapper pipeline.

**Location:** `packages/ai-powerups/src/api/graphql/BaseGraphQLSchema.ts`

### Resolver dependencies

Add: `[AiPowerUpsSettingsGroupGraphQLMapper, { multiple: true }]`

Keep: `GetSettingsUseCase`, `UpdateSettingsUseCase`

### `getSettings` resolver

1. Call `GetSettingsUseCase.execute()` → `IAiPowerUpsSettings`
2. Build mapper lookup: `name → mapper`
3. For each key in settings:
   - If mapper exists: `await mapper.toApi(settings[key])` → assign to result
   - If no mapper: pass through as-is
4. Return result

### `updateSettings` resolver

1. Call `GetSettingsUseCase.execute()` → current `IAiPowerUpsSettings`
2. Build mapper lookup: `name → mapper`
3. For each key in `args.input`:
   - If mapper exists: `await mapper.fromApi(args.input[key], current[key])` → assign to assembled object
   - If no mapper: assign `args.input[key]` directly
4. Merge: start with current settings, overlay assembled sections (sections not in input are carried forward)
5. Call `UpdateSettingsUseCase.execute(assembled)` → result
6. Run `toApi` per section on the result (same as read path)
7. Return mapped result

### End state

The resolver is a thin orchestration layer between GraphQL transport and the internal domain. It delegates all shape translation to mappers, all validation and storage to the repository pipeline.

---

## Phase 6: Cleanup + Consumer Updates

Remove dead code and update consumers to use the new internal shape.

### Delete

- `api/types.ts` — old `AiProvider`, `AiPowerUpsSettings` types (replaced by empty `IAiPowerUpsSettings` + provider plugin augmentation)
- `features/UpdateSettings/validation.ts` — validation moved to handler `inputSchema`
- Any direct `Encryption` imports from the repositories

### Update `WbGeneratePageContentUseCase`

This use case currently reads `settings.providers.presets[0].apiKey` (decrypted plaintext). After the refactor, the internal shape has `apiKeyEncrypted` instead.

The use case must inject `Encryption` and decrypt at point of use:

```ts
const preset = settings.providers.presets[0];
const apiKey = await this.encryption.decrypt(preset.apiKeyEncrypted);
```

**Note:** This update is owned by the user, not this plan.

### Update domain event types

`features/UpdateSettings/events.ts` and `features/UpdateSettings/abstractions.ts`:

- Update `AiPowerUpsSettingsBeforeUpdatePayload.input` type to `IAiPowerUpsSettings`
- Update `AiPowerUpsSettingsAfterUpdatePayload.settings` type to `IAiPowerUpsSettings`
- Remove old `UpdateSettingsInput` type from abstractions (replaced by `IAiPowerUpsSettings`)

### End state

No dead code. All consumers use the new type system. The old monolithic settings code is fully replaced.

---

## Phase Summary

| Phase | What                                               | Where                                 | Depends on     |
| ----- | -------------------------------------------------- | ------------------------------------- | -------------- |
| 1     | Masker DI abstraction                              | `api-core/features/masker/`           | —              |
| 2     | Core abstractions + updated types                  | `ai-powerups/api/`                    | —              |
| 3     | Refactor GetSettings + UpdateSettings repositories | `ai-powerups/api/features/`           | Phase 2        |
| 4     | Providers plugin (handler + mapper)                | `ai-powerups/api/features/providers/` | Phases 1, 2    |
| 5     | Refactor GraphQL resolver                          | `ai-powerups/api/graphql/`            | Phases 2, 3    |
| 6     | Cleanup + consumer updates                         | `ai-powerups/api/`                    | Phases 3, 4, 5 |

Phases 1 and 2 are independent and can be worked in parallel. Phases 3 and 4 can also be parallel (they share Phase 2 but don't depend on each other). Phase 5 depends on the repositories being refactored. Phase 6 is final cleanup after everything else lands.
