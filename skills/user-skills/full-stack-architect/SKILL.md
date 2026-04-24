---
name: webiny-full-stack-architect
context: webiny-extensions
description: >
  Full-stack extension skeleton and registration pattern. Use this skill when creating
  an extension that spans both API and Admin — the top-level component with Api.Extension
  and Admin.Extension entry points, shared domain layer, BuildParam declarations, and
  package structure. References webiny-api-architect and webiny-admin-architect for layer-specific details.
---

# Full-Stack Extension Skeleton

## TL;DR

A full-stack extension bundles **API** and **Admin** into a single package with a shared domain layer. The top-level component registers both sides via `<Api.Extension>` and `<Admin.Extension>`, which point to separate entry-point files. Each side follows its own layered architecture pattern — see **webiny-api-architect** and **webiny-admin-architect** skills for details.

## RULE — Extension Entry Points

> **Admin extensions CANNOT be directly mounted in `webiny.config.tsx` or in any child component tree without going through `<Admin.Extension />`.**

The same rule applies to API extensions — they must go through `<Api.Extension />`.

These entry-point components are the **only** way to register code that runs inside the Admin app or the API runtime. They use the `src` prop to point to a file that will be loaded in the correct execution environment (browser for Admin, Lambda for API). Bypassing these entry points will fail at runtime because the Admin and API contexts (DI containers, routers, GraphQL registries, etc.) are not available outside their respective runtimes.

**YOU MUST include the full file path with the `.ts` or `.tsx` extension in every `src` prop.** For example, use `src={"/extensions/lead/src/index.ts"}`, NOT `src={"/extensions/lead"}`. Omitting the file extension will cause a build failure.

**YOU MUST use `export default` for the `createImplementation()` call** when the file is targeted directly by an Extension `src` prop. Using a named export (`export const Foo = SomeFactory.createImplementation(...)`) will cause a build failure. Named exports are only valid inside files registered via `createFeature`.

```tsx
// CORRECT — always use entry-point components
<Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
<Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />

// WRONG — never mount admin/api code directly
<MyAdminComponent />     // Will not have access to Admin DI container
<MyApiFeature />         // Will not have access to API DI container
```

## Package Structure

```
my-extension/
├── src/
│   ├── index.ts                  # Single public export
│   ├── MyExtension.tsx           # Top-level component (registers Api + Admin)
│   ├── shared/                   # Shared between API and Admin
│   │   ├── constants.ts          # Model IDs, permission names, etc.
│   │   └── types.ts              # Shared types
│   ├── api/                      # API-side code → see webiny-api-architect skill
│   │   ├── Extension.ts
│   │   ├── domain/
│   │   ├── features/
│   │   └── graphql/
│   └── admin/                    # Admin-side code → see webiny-admin-architect skill
│       ├── Extension.tsx
│       ├── features/
│       └── presentation/
```

## Top-Level Component

The top-level component is the single entry point that consumers use. It registers both the API and Admin extensions:

```tsx
// src/MyExtension.tsx
import React from "react";
import { Api, Admin } from "webiny/extensions";

export const MyExtension = () => {
  return (
    <>
      {/* API extensions — runs in Lambda */}
      <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

      {/* Admin extensions — runs in browser */}
      <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
    </>
  );
};
```

Conditional rendering can wrap the entry points (e.g., feature flags, config parameters):

```tsx
<Infra.Env.Is name={"prod"}>
  <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
  <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
</Infra.Env.Is>
```

## Shared Domain Layer

The `shared/` directory contains types and value objects used by both API and Admin:

```ts
// src/shared/constants.ts
export const MY_MODEL_ID = "myModel";

// src/shared/MyEntity.ts
export interface MyEntityValues {
  name: string;
  status: "active" | "inactive";
}

export interface MyEntityDto {
  id: string;
  values: MyEntityValues;
}

export class MyEntity {
  private constructor(private dto: MyEntityDto) {}

  static from(dto: MyEntityDto) {
    return new MyEntity(dto);
  }

  get id() {
    return this.dto.id;
  }

  get values() {
    return this.dto.values;
  }
}
```

## Build Parameters

Build parameters pass configuration from `webiny.config.tsx` (build time) into both the API runtime and the Admin app. **A deployed API must NEVER use `process.env` to read configuration.**

**`BuildParam` declarations MUST live inside the extension's top-level component, NOT in `webiny.config.tsx`.** Required parameters are exposed as React props on the extension component.

### Declaring BuildParams

```tsx
// src/MyExtension.tsx — declares build params as React props
interface MyExtensionProps {
  apiEndpoint: string;
  dashboardUrl: string;
}

export const MyExtension = ({ apiEndpoint, dashboardUrl }: MyExtensionProps) => {
  return (
    <>
      <Api.BuildParam paramName="MY_API_ENDPOINT" value={apiEndpoint} />
      <Admin.BuildParam paramName="DASHBOARD_URL" value={dashboardUrl} />

      <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
      <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
    </>
  );
};
```

### Consuming in `webiny.config.tsx`

```tsx
// webiny.config.tsx — the ONLY place where process.env is read
<MyExtension
  apiEndpoint={process.env.MY_API_ENDPOINT || ""}
  dashboardUrl={process.env.DASHBOARD_URL || ""}
/>
```

### Reading BuildParams

- **API side:** Inject `BuildParams` via DI — see **webiny-api-architect** skill
- **Admin side:** Use `useBuildParams()` hook — see **webiny-admin-architect** skill

## Checklist

1. Create top-level component that uses `<Api.Extension>` and `<Admin.Extension>` — never mount admin/api code directly
2. Put shared domain models and constants in `shared/`
3. Declare `<Api.BuildParam>` / `<Admin.BuildParam>` in the top-level component, not in `webiny.config.tsx`
4. API entry point uses `createFeature` with `register(container)` — see **webiny-api-architect**
5. Admin entry point is a React component with `<RegisterFeature>` — see **webiny-admin-architect**
6. Use `.js` extensions in all import paths (ESM modules)

## Quick Reference

```
Entry point:            <Api.Extension src={...} /> + <Admin.Extension src={...} />
Shared code:            shared/ directory for domain models, constants, types
API architecture:       → see webiny-api-architect skill
Admin architecture:     → see webiny-admin-architect skill
DI pattern:             → see webiny-dependency-injection skill
BuildParam declare:     <Api.BuildParam paramName="KEY" value={prop} />
                        <Admin.BuildParam paramName="KEY" value={prop} />
BuildParam read (API):  buildParams.get<T>("KEY") via DI (→ webiny-api-architect)
BuildParam read (Admin): useBuildParams().get<T>("KEY") (→ webiny-admin-architect)
Import extensions:      Always use .js extensions in import paths (ESM)
```

## Related Skills

- **webiny-api-architect** — API-side architecture (features, abstractions, container registration)
- **webiny-admin-architect** — Admin-side architecture (headless + presentation features)
- **webiny-project-structure** — Extension registration and `webiny.config.tsx`
- **webiny-dependency-injection** — The `createImplementation` DI pattern and injectable services
