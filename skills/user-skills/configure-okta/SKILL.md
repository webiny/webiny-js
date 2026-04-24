---
name: webiny-configure-okta
description: >
  Configuring Okta as an identity provider (IDP) for Webiny projects.
  Use this skill when the developer asks about Okta authentication, Okta SSO,
  replacing Cognito with Okta, setting up external identity providers, configuring
  OIDC authentication, mapping JWT claims to Webiny identities, or customizing
  the Okta login flow. Also relevant when asking about OKTA_ISSUER, OKTA_CLIENT_ID
  environment variables, OktaIdpConfig, or the MyOktaExtension pattern.
---

# Configure Okta Authentication

## TL;DR

Webiny supports Okta as an external identity provider (IDP) to replace the default Cognito authentication. First, install the `@webiny/okta` package (using the same version as the `webiny` dependency in `package.json`). Then create two files: an API config class that maps Okta JWT claims to Webiny identity data (`OktaIdpConfig`), and a React extension component (`<Okta />`) that wires issuer URL, client ID, and the API config path. Register the extension in `webiny.config.tsx`, set two environment variables (`OKTA_ISSUER`, `OKTA_CLIENT_ID`), and deploy.

## Pattern / Core Concept

Okta integration has two parts:

1. **API Config** — A class implementing `OktaIdpConfig.Interface` that maps JWT token claims to Webiny's identity structure. Registered via `OktaIdpConfig.createImplementation()` (the universal DI pattern).
2. **Extension Component** — A React component that renders `<Okta />` from `@webiny/okta`, passing the issuer URL, client ID, and path to the API config file. The `<Okta />` component handles environment variable injection, API extension registration, and Admin login screen setup automatically.

### How `<Okta />` Works Internally

The `<Okta />` component (from `@webiny/okta`) is a `defineExtension` that:

- Sets Lambda env vars: `OKTA_ISSUER`, `OKTA_CLIENT_ID`
- Sets Admin app env vars: `REACT_APP_IDP_TYPE=okta`, `REACT_APP_OKTA_ISSUER`, `REACT_APP_OKTA_CLIENT_ID`
- Registers the internal `OktaIdpFeature` API extension (OIDC token verification)
- Registers your custom API config extension (identity mapping)
- Registers the Admin Okta login screen extension

## Reference Tables

### `OktaIdpConfig.Interface`

| Method              | Signature                                                      | Required | Description                                           |
| ------------------- | -------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `getIdentity`       | `(token: JwtPayload) => OktaIdentity \| Promise<OktaIdentity>` | Yes      | Maps JWT claims to Webiny identity data               |
| `verifyTokenClaims` | `(token: JwtPayload) => void \| Promise<void>`                 | No       | Custom claim verification (throw to reject the token) |

### `OktaIdentity` (Return Type of `getIdentity`)

| Field         | Type                             | Description                                      |
| ------------- | -------------------------------- | ------------------------------------------------ |
| `id`          | `string`                         | Unique user ID (typically `token["sub"]`)        |
| `displayName` | `string`                         | User's display name                              |
| `roles`       | `string[]`                       | Webiny security roles to assign                  |
| `teams`       | `string[]`                       | Webiny teams (optional, filter out falsy values) |
| `profile`     | `{ firstName, lastName, email }` | User profile fields                              |
| `context`     | `object`                         | Runtime data (not stored in DB)                  |

### `<Okta />` Component Props

| Prop        | Type     | Description                                        |
| ----------- | -------- | -------------------------------------------------- |
| `issuer`    | `string` | Okta issuer URL (e.g., `https://dev-xxx.okta.com`) |
| `clientId`  | `string` | Okta application client ID                         |
| `apiConfig` | `string` | Absolute path to the API config file               |

### Environment Variables

| Variable         | Used By     | Description                |
| ---------------- | ----------- | -------------------------- |
| `OKTA_ISSUER`    | API + Admin | Okta issuer URL            |
| `OKTA_CLIENT_ID` | API + Admin | Okta application client ID |

## Full Examples

### Example 1: Basic Okta Configuration

**Step 0: Install the `@webiny/okta` dependency**

`@webiny/okta` is an optional dependency. Add it to `package.json` using the same version as the `webiny` dependency, then install:

```bash
# Check the webiny version in package.json, then add @webiny/okta with the same version
# For example, if "webiny": "^0.0.0-unstable.xxx":
yarn add @webiny/okta@^0.0.0-unstable.xxx
```

> **Important:** After adding the dependency, tell the user to run `yarn` to install it. Do NOT run `yarn` automatically — let the user do it.

**Step 1: Create the API config**

Create `extensions/okta/MyOktaConfig.ts`:

```typescript
import { OktaIdpConfig } from "@webiny/okta";

class MyIdpConfig implements OktaIdpConfig.Interface {
  getIdentity(token: OktaIdpConfig.JwtPayload) {
    return {
      id: String(token["sub"]),
      displayName: token["name"],
      roles: [token["webiny_group"]],
      teams: [token["team"]].filter(Boolean),
      profile: {
        firstName: token["first_name"],
        lastName: token["last_name"],
        email: token["email"]
      },
      context: {
        canAccessTenant: true,
        defaultTenant: "root"
      }
    };
  }
}

const MyOktaConfig = OktaIdpConfig.createImplementation({
  implementation: MyIdpConfig,
  dependencies: []
});

export default MyOktaConfig;
```

**Step 2: Create the extension component**

Create `extensions/okta/MyOktaExtension.tsx`:

```tsx
import React from "react";
import { Okta } from "@webiny/okta";

export const MyOktaExtension = () => {
  return (
    <Okta
      issuer={String(process.env.OKTA_ISSUER)}
      clientId={String(process.env.OKTA_CLIENT_ID)}
      apiConfig={import.meta.dirname + "/MyOktaConfig.ts"}
    />
  );
};
```

**Step 3: Register in `webiny.config.tsx`**

```tsx
import React from "react";
import { MyOktaExtension } from "./extensions/okta/MyOktaExtension.js";

export const Extensions = () => {
  return (
    <>
      {/* Replace <Cognito /> with Okta */}
      <MyOktaExtension />

      {/* ... other extensions ... */}
    </>
  );
};
```

**Step 4: Set environment variables**

Add to your `.env` file (or CI/CD environment):

```
OKTA_ISSUER=https://dev-xxxxx.okta.com/oauth2/default
OKTA_CLIENT_ID=your-okta-client-id
```

**Step 5: Deploy**

```bash
yarn webiny deploy
```

### Example 2: Custom Claim Verification

If your Okta setup uses custom claims that need validation:

```typescript
import { OktaIdpConfig } from "@webiny/okta";

class MyIdpConfig implements OktaIdpConfig.Interface {
  getIdentity(token: OktaIdpConfig.JwtPayload) {
    return {
      id: String(token["sub"]),
      displayName: token["name"],
      roles: [token["webiny_role"]],
      profile: {
        firstName: token["given_name"],
        lastName: token["family_name"],
        email: token["email"]
      },
      context: {
        canAccessTenant: true,
        defaultTenant: "root"
      }
    };
  }

  verifyTokenClaims(token: OktaIdpConfig.JwtPayload) {
    // Reject tokens without the required custom claim
    if (!token["webiny_role"]) {
      throw new Error("Token is missing the 'webiny_role' claim.");
    }

    // Reject tokens from unauthorized organizations
    const allowedOrgs = ["org_abc123", "org_def456"];
    if (!allowedOrgs.includes(token["org_id"] as string)) {
      throw new Error("User does not belong to an authorized organization.");
    }
  }
}

const MyOktaConfig = OktaIdpConfig.createImplementation({
  implementation: MyIdpConfig,
  dependencies: []
});

export default MyOktaConfig;
```

### Example 3: Using DI Dependencies in Config

If your config needs access to other Webiny services (e.g., to look up tenant-specific roles):

```typescript
import { OktaIdpConfig } from "@webiny/okta";
import { TenantContext } from "webiny/api/tenancy";

class MyIdpConfig implements OktaIdpConfig.Interface {
  constructor(private tenantContext: TenantContext.Interface) {}

  getIdentity(token: OktaIdpConfig.JwtPayload) {
    const tenant = this.tenantContext.getTenant();

    return {
      id: String(token["sub"]),
      displayName: token["name"],
      roles: [token["webiny_group"]],
      profile: {
        firstName: token["first_name"],
        lastName: token["last_name"],
        email: token["email"]
      },
      context: {
        canAccessTenant: true,
        defaultTenant: tenant?.id ?? "root"
      }
    };
  }
}

const MyOktaConfig = OktaIdpConfig.createImplementation({
  implementation: MyIdpConfig,
  dependencies: [TenantContext]
});

export default MyOktaConfig;
```

## Quick Reference

### Imports

```typescript
// API config
import { OktaIdpConfig } from "@webiny/okta";

// Extension component
import { Okta } from "@webiny/okta";
```

### Key Interfaces

| Interface                    | Package        | Purpose                          |
| ---------------------------- | -------------- | -------------------------------- |
| `OktaIdpConfig.Interface`    | `@webiny/okta` | API-side JWT-to-identity mapping |
| `OktaIdpConfig.JwtPayload`   | `@webiny/okta` | JWT token payload type           |
| `OktaIdpConfig.IdentityData` | `@webiny/okta` | Identity return type             |

### File Structure

```
extensions/okta/
├── MyOktaConfig.ts        # API config (JWT claim mapping)
└── MyOktaExtension.tsx    # Extension component (Okta setup)
```

### Registration

In `webiny.config.tsx`, replace `<Cognito />` with `<MyOktaExtension />`.

### Deploy

```bash
yarn webiny deploy        # Deploy all (Core + API + Admin)
```

Both API and Admin need to be redeployed since Okta affects both the backend (token verification, identity mapping) and the frontend (login screen).

## Related Skills

- **webiny-dependency-injection** — The universal DI pattern used by `OktaIdpConfig.createImplementation()`
- **webiny-project-structure** — How `webiny.config.tsx` and extensions are organized
- **webiny-local-development** — Deploying and testing your Okta configuration
