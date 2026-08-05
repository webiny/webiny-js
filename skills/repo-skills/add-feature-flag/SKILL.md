---
name: webiny-add-feature-flag
description: >
  Adding a new feature flag to the Webiny system. Use this skill when creating a new
  feature flag (simple boolean or nested group), gating a feature at the config/admin/API
  level, or wiring a flag into the WCP license system. Covers IFeatureFlagsDto, KnownFeatureFlag,
  Zod schema, FeatureFlag.CanUse components, useFeatureFlags().isEnabled(), the API FeatureFlags
  abstraction, toDto(), and the LICENSE_CHECKS decorator pattern.
---

# Adding a New Feature Flag

Feature flags are the primary authority for feature availability. A WCP license can restrict flags it governs, but flags work standalone without a license.

## Architecture

- **`FeatureFlags` class** (`packages/feature-flags/src/FeatureFlags.ts`) — single `isEnabled(name)` method resolves dot-path strings against the DTO. All flags default to enabled (`!== false`).
- **`IFeatureFlagsDto`** (`packages/feature-flags/src/types.ts`) — the typed DTO interface.
- **`KnownFeatureFlag`** (`packages/feature-flags/src/FeatureFlags.ts`) — string literal union for autocomplete.
- **Zod schema** (`packages/project/src/extensions/FeatureFlags.tsx`) — validates the config input.
- **`toDto()`** returns the fully resolved state (all flags explicitly set), used by the `featureFlags` GraphQL query.

## Steps to Add a Simple Boolean Flag

### 1. Add to DTO type

**File:** `packages/feature-flags/src/types.ts`

Add the new flag to `IFeatureFlagsDto`:

```ts
export interface IFeatureFlagsDto {
    // ... existing flags
    myNewFeature?: boolean;
}
```

### 2. Add to KnownFeatureFlag union

**File:** `packages/feature-flags/src/FeatureFlags.ts`

Add the string to the `KnownFeatureFlag` type:

```ts
export type KnownFeatureFlag =
    // ... existing flags
    | "myNewFeature";
```

### 3. Add to toDto()

**File:** `packages/feature-flags/src/FeatureFlags.ts`

Add the flag to the `toDto()` method so the API returns it:

```ts
toDto() {
    return {
        // ... existing flags
        myNewFeature: this.isEnabled("myNewFeature")
    };
}
```

### 4. Add to Zod schema

**File:** `packages/project/src/extensions/FeatureFlags.tsx`

Add to the `paramsSchema` so users get validation in `webiny.config.tsx`:

```ts
myNewFeature: z.boolean().optional()
```

### 5. Gate the feature

At the **config level** (controls whether extensions mount at build time):

```tsx
// In the extension component (e.g., MyFeature.tsx)
import { FeatureFlag } from "@webiny/project";

export const MyFeature = () => (
    <FeatureFlag.CanUse name="myNewFeature">
        <Api.Extension src={...} />
        <Admin.Extension src={...} />
    </FeatureFlag.CanUse>
);
```

Or add a named convenience component in `packages/project/src/components/FeatureFlag.tsx`:

```tsx
function CanUseMyNewFeature({ children }: { children: React.ReactNode }) {
    return <CanUse name="myNewFeature">{children}</CanUse>;
}
```

At the **admin runtime level** (controls UI visibility):

```tsx
import { useFeatureFlags } from "@webiny/app-admin";

const featureFlags = useFeatureFlags();
if (!featureFlags.isEnabled("myNewFeature")) {
    return null;
}
```

At the **API runtime level** (controls backend behavior):

```ts
import { FeatureFlags } from "~/features/featureFlags/abstractions.js";

// In a DI-resolved class:
constructor(private featureFlags: FeatureFlags.Interface) {}

someMethod() {
    if (!this.featureFlags.get().isEnabled("myNewFeature")) {
        return;
    }
}
```

### 6. User configuration

Users configure flags in `webiny.config.tsx`:

```tsx
export const FeatureFlags = () => (
    <Project.FeatureFlags
        features={{
            myNewFeature: false  // disabled
        }}
    />
);
```

Omitting a flag means it's enabled by default.

## Adding a Nested Flag Group

For flags with sub-options (like `aiPowerups` or `advancedAccessControlLayer`):

### DTO type — use a union:

```ts
export interface IMyFeatureOptions {
    subFeatureA?: boolean;
    subFeatureB?: boolean;
}

export interface IFeatureFlagsDto {
    myFeature?: boolean | IMyFeatureOptions;
}
```

### KnownFeatureFlag — add parent and children:

```ts
export type KnownFeatureFlag =
    | "myFeature"
    | "myFeature.subFeatureA"
    | "myFeature.subFeatureB";
```

### toDto() — collapse parent when disabled:

```ts
myFeature: this.isEnabled("myFeature")
    ? {
          subFeatureA: this.isEnabled("myFeature.subFeatureA"),
          subFeatureB: this.isEnabled("myFeature.subFeatureB")
      }
    : false
```

### Zod schema — union type:

```ts
myFeature: z
    .union([
        z.boolean(),
        z.object({
            subFeatureA: z.boolean().optional(),
            subFeatureB: z.boolean().optional()
        })
    ])
    .optional()
```

### User config:

```tsx
// Disable entirely
<Project.FeatureFlags features={{ myFeature: false }} />

// Disable specific sub-feature
<Project.FeatureFlags features={{ myFeature: { subFeatureA: false } }} />
```

## Optional: WCP License Gating

If the flag should be restricted by a WCP license, add it to the `LICENSE_CHECKS` map in the decorators:

**API level:** `packages/api-core/src/features/featureFlags/decorators/FeatureFlagsWithLicenseDecorator.ts`
**Build level:** `packages/project/src/decorators/GetFeatureFlagsWithLicense.ts`
**Config level:** `packages/project/src/services/GetProjectConfigService/LicenseDecoratedFeatureFlags.ts`

```ts
const LICENSE_CHECKS: Record<string, (license: ILicense) => boolean> = {
    // ... existing checks
    myNewFeature: l => l.canUseMyNewFeature()
};
```

This also requires adding `canUseMyNewFeature()` to the `ILicense` interface and its implementations in `@webiny/wcp`. Skip this if the flag is not license-gated.

## Files Reference

| Purpose | File |
|---------|------|
| DTO type | `packages/feature-flags/src/types.ts` |
| FeatureFlags class + KnownFeatureFlag | `packages/feature-flags/src/FeatureFlags.ts` |
| Zod schema | `packages/project/src/extensions/FeatureFlags.tsx` |
| Config-level CanUse components | `packages/project/src/components/FeatureFlag.tsx` |
| Admin hook | `packages/app-admin/src/presentation/featureFlags/useFeatureFlags.ts` |
| API abstraction | `packages/api-core/src/features/featureFlags/abstractions.ts` |
| API license decorator | `packages/api-core/src/features/featureFlags/decorators/FeatureFlagsWithLicenseDecorator.ts` |
| Build license decorator | `packages/project/src/decorators/GetFeatureFlagsWithLicense.ts` |
| Config license decorator | `packages/project/src/services/GetProjectConfigService/LicenseDecoratedFeatureFlags.ts` |
| GraphQL query | `packages/api-core/src/graphql/featureFlags/FeatureFlagsSchemaFactory.ts` |
