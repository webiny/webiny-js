---
name: webiny-configure-auth0
description: >
  Configuring Auth0 as an identity provider (IDP) for Webiny projects.
  Use this skill when the developer asks about Auth0 authentication, Auth0 SSO,
  replacing Cognito with Auth0, setting up external identity providers, configuring
  OIDC authentication, mapping JWT claims to Webiny identities, or customizing
  the Auth0 login flow. Also relevant when asking about AUTH0_ISSUER, AUTH0_CLIENT_ID
  environment variables, Auth0IdpConfig, or the MyAuth0Extension pattern.
---

# Configure Auth0 Authentication

## TL;DR

Webiny supports Auth0 as an external identity provider (IDP) to replace the default Cognito authentication. First, install the `@webiny/auth0` package (using the same version as the `webiny` dependency in `package.json`). Then create two files: an API config class that maps Auth0 JWT claims to Webiny identity data (`Auth0IdpConfig`), and a React extension component (`<Auth0 />`) that wires issuer URL, client ID, and the API config path. Register the extension in `webiny.config.tsx`, set two environment variables (`AUTH0_ISSUER`, `AUTH0_CLIENT_ID`), and deploy.

## Pattern / Core Concept

Auth0 integration has two parts:

1. **API Config** — A class implementing `Auth0IdpConfig.Interface` that maps JWT token claims to Webiny's identity structure. Registered via `Auth0IdpConfig.createImplementation()` (the universal DI pattern).
2. **Extension Component** — A React component that renders `<Auth0 />` from `@webiny/auth0`, passing the issuer URL, client ID, and path to the API config file. The `<Auth0 />` component handles environment variable injection, API extension registration, and Admin login screen setup automatically.

### How `<Auth0 />` Works Internally

The `<Auth0 />` component (from `@webiny/auth0`) is a `defineExtension` that:

- Sets Lambda env vars: `AUTH0_ISSUER`, `AUTH0_CLIENT_ID`
- Sets Admin app env vars: `REACT_APP_IDP_TYPE=auth0`, `REACT_APP_AUTH0_ISSUER`, `REACT_APP_AUTH0_CLIENT_ID`
- Registers the internal `Auth0IdpFeature` API extension (OIDC token verification)
- Registers your custom API config extension (identity mapping)
- Registers the Admin Auth0 login screen extension

## Reference Tables

### `Auth0IdpConfig.Interface`

| Method              | Signature                                                        | Required | Description                                           |
| ------------------- | ---------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `getIdentity`       | `(token: JwtPayload) => Auth0Identity \| Promise<Auth0Identity>` | Yes      | Maps JWT claims to Webiny identity data               |
| `verifyTokenClaims` | `(token: JwtPayload) => void \| Promise<void>`                   | No       | Custom claim verification (throw to reject the token) |

### `Auth0Identity` (Return Type of `getIdentity`)

| Field         | Type                             | Description                                      |
| ------------- | -------------------------------- | ------------------------------------------------ |
| `id`          | `string`                         | Unique user ID (typically `token["sub"]`)        |
| `displayName` | `string`                         | User's display name                              |
| `roles`       | `string[]`                       | Webiny security roles to assign                  |
| `teams`       | `string[]`                       | Webiny teams (optional, filter out falsy values) |
| `profile`     | `{ firstName, lastName, email }` | User profile fields                              |
| `context`     | `object`                         | Runtime data (not stored in DB)                  |

### `<Auth0 />` Component Props

| Prop        | Type     | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| `issuer`    | `string` | Auth0 issuer URL (e.g., `https://your-tenant.auth0.com`) |
| `clientId`  | `string` | Auth0 application client ID                              |
| `apiConfig` | `string` | Absolute path to the API config file                     |

### Environment Variables

| Variable          | Used By     | Description                 |
| ----------------- | ----------- | --------------------------- |
| `AUTH0_ISSUER`    | API + Admin | Auth0 issuer URL            |
| `AUTH0_CLIENT_ID` | API + Admin | Auth0 application client ID |

## Full Examples

### Example 1: Basic Auth0 Configuration

**Step 0: Install the `@webiny/auth0` dependency**

`@webiny/auth0` is an optional dependency. Add it to `package.json` using the same version as the `webiny` dependency, then install:

```bash
# Check the webiny version in package.json, then add @webiny/auth0 with the same version
# For example, if "webiny": "^0.0.0-unstable.xxx":
yarn add @webiny/auth0@^0.0.0-unstable.xxx
```

> **Important:** After adding the dependency, tell the user to run `yarn` to install it. Do NOT run `yarn` automatically — let the user do it.

**Step 1: Create the API config**

Create `extensions/auth0/MyAuth0Config.ts`:

```typescript
import { Auth0IdpConfig } from "@webiny/auth0";

class MyIdpConfig implements Auth0IdpConfig.Interface {
  getIdentity(token: Auth0IdpConfig.JwtPayload) {
    return {
      id: String(token["sub"]),
      displayName: token["name"],
      roles: ["full-access"],
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
}

const MyAuth0Config = Auth0IdpConfig.createImplementation({
  implementation: MyIdpConfig,
  dependencies: []
});

export default MyAuth0Config;
```

**Step 2: Create the extension component**

Create `extensions/auth0/MyAuth0Extension.tsx`:

```tsx
import React from "react";
import { Auth0 } from "@webiny/auth0";

export const MyAuth0Extension = () => {
  return (
    <Auth0
      issuer={String(process.env.AUTH0_ISSUER)}
      clientId={String(process.env.AUTH0_CLIENT_ID)}
      apiConfig={import.meta.dirname + "/MyAuth0Config.ts"}
    />
  );
};
```

**Step 3: Register in `webiny.config.tsx`**

```tsx
import React from "react";
import { MyAuth0Extension } from "./extensions/auth0/MyAuth0Extension.js";

export const Extensions = () => {
  return (
    <>
      {/* Replace <Cognito /> with Auth0 */}
      <MyAuth0Extension />

      {/* ... other extensions ... */}
    </>
  );
};
```

**Step 4: Set environment variables**

Add to your `.env` file (or CI/CD environment):

```
AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_CLIENT_ID=your-auth0-client-id
```

**Step 5: Deploy**

```bash
yarn webiny deploy
```

### Example 2: Custom Claim Verification

If your Auth0 setup uses custom claims (e.g., via Auth0 Actions or Rules) that need validation:

```typescript
import { Auth0IdpConfig } from "@webiny/auth0";

class MyIdpConfig implements Auth0IdpConfig.Interface {
  getIdentity(token: Auth0IdpConfig.JwtPayload) {
    return {
      id: String(token["sub"]),
      displayName: token["name"],
      roles: [token["https://webiny.com/role"]],
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

  verifyTokenClaims(token: Auth0IdpConfig.JwtPayload) {
    // Reject tokens without the required custom claim
    if (!token["https://webiny.com/role"]) {
      throw new Error("Token is missing the 'https://webiny.com/role' claim.");
    }

    // Reject tokens from unauthorized organizations
    if (token["org_id"] && token["org_id"] !== "org_expected") {
      throw new Error("User does not belong to the authorized organization.");
    }
  }
}

const MyAuth0Config = Auth0IdpConfig.createImplementation({
  implementation: MyIdpConfig,
  dependencies: []
});

export default MyAuth0Config;
```

### Example 3: Using DI Dependencies in Config

If your config needs access to other Webiny services (e.g., to look up tenant-specific roles):

```typescript
import { Auth0IdpConfig } from "@webiny/auth0";
import { TenantContext } from "webiny/api/tenancy";

class MyIdpConfig implements Auth0IdpConfig.Interface {
  constructor(private tenantContext: TenantContext.Interface) {}

  getIdentity(token: Auth0IdpConfig.JwtPayload) {
    const tenant = this.tenantContext.getTenant();

    return {
      id: String(token["sub"]),
      displayName: token["name"],
      roles: [token["https://webiny.com/role"]],
      profile: {
        firstName: token["given_name"],
        lastName: token["family_name"],
        email: token["email"]
      },
      context: {
        canAccessTenant: true,
        defaultTenant: tenant?.id ?? "root"
      }
    };
  }
}

const MyAuth0Config = Auth0IdpConfig.createImplementation({
  implementation: MyIdpConfig,
  dependencies: [TenantContext]
});

export default MyAuth0Config;
```

## Quick Reference

### Imports

```typescript
// API config
import { Auth0IdpConfig } from "@webiny/auth0";

// Extension component
import { Auth0 } from "@webiny/auth0";
```

### Key Interfaces

| Interface                     | Package         | Purpose                          |
| ----------------------------- | --------------- | -------------------------------- |
| `Auth0IdpConfig.Interface`    | `@webiny/auth0` | API-side JWT-to-identity mapping |
| `Auth0IdpConfig.JwtPayload`   | `@webiny/auth0` | JWT token payload type           |
| `Auth0IdpConfig.IdentityData` | `@webiny/auth0` | Identity return type             |

### File Structure

```
extensions/auth0/
├── MyAuth0Config.ts        # API config (JWT claim mapping)
└── MyAuth0Extension.tsx    # Extension component (Auth0 setup)
```

### Registration

In `webiny.config.tsx`, replace `<Cognito />` with `<MyAuth0Extension />`.

### Deploy

```bash
yarn webiny deploy        # Deploy all (Core + API + Admin)
```

Both API and Admin need to be redeployed since Auth0 affects both the backend (token verification, identity mapping) and the frontend (login screen).

## Related Skills

- **webiny-configure-okta** — Alternative IDP: configuring Okta authentication
- **webiny-dependency-injection** — The universal DI pattern used by `Auth0IdpConfig.createImplementation()`
- **webiny-project-structure** — How `webiny.config.tsx` and extensions are organized
- **webiny-local-development** — Deploying and testing your Auth0 configuration
