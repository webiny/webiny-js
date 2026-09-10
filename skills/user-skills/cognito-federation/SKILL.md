---
name: webiny-cognito-federation
description: >
  Configuring Cognito Federation for Webiny projects — federated sign-in via
  external identity providers (Google, Facebook, Apple, Amazon, OIDC/Entra ID)
  while keeping Cognito as the user pool. Use this skill when the developer asks
  about Cognito federation, SSO with Cognito, adding Google/Microsoft/OIDC login
  to Cognito, federated identity providers, CognitoSignInConfig, CognitoIdpConfig, external
  users, signInWithRedirect, OAuth redirect URLs, hiding the password form,
  allowCredentialsLogin, or customizing the federated login screen.
---

# Cognito Federation

## TL;DR

Webiny supports federated sign-in through Cognito — users authenticate via external identity providers (Google, Entra ID, etc.) while Cognito remains the user pool. Configure it by adding a `federation` prop to `<Cognito />` in `webiny.config.tsx`. This handles both infrastructure (Cognito User Pool Domain, IdP resources, OAuth client) and the admin login screen (provider buttons, OAuth for Amplify). Federated users are auto-detected and synced into Webiny. For advanced use cases, provide `apiConfig` (custom identity mapping) and/or `adminConfig` (custom login screen behavior).

## Pattern / Core Concept

Cognito Federation has three layers:

1. **Infrastructure** — The `federation` prop on `<Cognito />`, under the hood, creates the Cognito User Pool Domain, Identity Provider resources, and configures OAuth on the User Pool Client.

2. **Admin Login Screen** — The federation config is passed as an `Admin.BuildParam` to the admin app. A `CognitoSignInConfig` abstraction provides the login screen with provider buttons, OAuth settings for Amplify, and credentials visibility. By default, this is auto-generated from the `federation` prop. For advanced customization (IP whitelists, async logic), provide an `adminConfig` extension.

3. **API Identity** — Federated tokens are auto-detected via the `identities` JWT claim and marked `external: true`. The `ExternalIdpUserSyncHandler` auto-creates/updates users on login. For custom role/team mapping, provide an `apiConfig` extension implementing `CognitoIdpConfig`.

### How Federated Login Works

1. User clicks a provider button on the login screen
2. `signInWithRedirect()` redirects to Cognito Hosted UI
3. Cognito redirects to the external IdP (Google, Entra ID, etc.)
4. After authentication, Cognito creates an `idToken` with an `identities` claim
5. The admin app picks up the session via `fetchAuthSession()`
6. The API detects `identities` in the token, sets `external: true`
7. `ExternalIdpUserSyncHandler` creates/updates the Webiny user with roles/teams

## Reference Tables

### `<Cognito />` Props

| Prop          | Type                              | Description                                      |
| ------------- | --------------------------------- | ------------------------------------------------ |
| `federation`  | `object \| () => Promise<object>` | Federation config (see below) — sync or async    |
| `mfa`         | `boolean`                         | Enable TOTP MFA for all users (default: `false`) |
| `apiConfig`   | `string`                          | Path to API identity mapping extension           |
| `adminConfig` | `string`                          | Path to Admin login customization extension      |

### `federation` Object

| Field                   | Type                | Required | Default        | Description                     |
| ----------------------- | ------------------- | -------- | -------------- | ------------------------------- |
| `domain`                | `string`            | Yes      | —              | Cognito User Pool domain prefix |
| `callbackUrls`          | `string[]`          | Yes      | —              | OAuth callback/redirect URLs    |
| `logoutUrls`            | `string[]`          | No       | `callbackUrls` | OAuth logout redirect URLs      |
| `responseType`          | `"code" \| "token"` | No       | `"code"`       | OAuth response type             |
| `allowCredentialsLogin` | `boolean`           | No       | `true`         | Show email/password form        |
| `identityProviders`     | `array`             | Yes      | —              | List of federated IdPs          |

### `identityProviders[]` Items

| Field              | Type                                                      | Required | Description                                                   |
| ------------------ | --------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `type`             | `"google" \| "facebook" \| "amazon" \| "apple" \| "oidc"` | Yes      | Provider type                                                 |
| `name`             | `string`                                                  | No       | Custom provider name (required for OIDC)                      |
| `label`            | `string`                                                  | Yes      | Button text on the login screen                               |
| `providerDetails`  | `object`                                                  | Yes      | AWS Cognito provider details (client_id, client_secret, etc.) |
| `attributeMapping` | `object`                                                  | No       | Custom attribute mapping (overrides defaults)                 |

### `CognitoSignInConfig.Interface` (Admin Customization)

| Method        | Signature               | Description                                    |
| ------------- | ----------------------- | ---------------------------------------------- |
| `getConfig()` | `() => Promise<Config>` | Returns federation config for the login screen |

### `CognitoSignInConfig.Config` (Return Type)

| Field                   | Type                                                        | Required | Description                             |
| ----------------------- | ----------------------------------------------------------- | -------- | --------------------------------------- |
| `oauth`                 | `{ scopes, redirectSignIn, redirectSignOut, responseType }` | Yes      | Amplify OAuth config                    |
| `allowCredentialsLogin` | `boolean`                                                   | Yes      | Show email/password form                |
| `providers`             | `FederatedProvider[]`                                       | Yes      | Provider buttons                        |
| `title`                 | `string`                                                    | No       | Login screen title (default: "Sign in") |
| `description`           | `string`                                                    | No       | Login screen description                |

### `FederatedProvider` (Union Type)

```ts
type FederatedProvider =
  | { name: string; label: string } // Auto-rendered button
  | { name: string; component: React.FC<{ signIn: () => void }> }; // Custom button
```

### `CognitoIdpConfig.Interface` (API Identity Mapping)

| Method              | Signature                                                            | Required | Description                        |
| ------------------- | -------------------------------------------------------------------- | -------- | ---------------------------------- |
| `getIdentity`       | `(token: JwtPayload) => CognitoIdentity \| Promise<CognitoIdentity>` | Yes      | Maps JWT claims to Webiny identity |
| `verifyTokenClaims` | `(token: JwtPayload) => void \| Promise<void>`                       | No       | Custom claim verification          |

### Identity Return Type

Default identity fields (`id`, `displayName`, `profile`) are auto-populated from standard Cognito claims (`custom:id`, `given_name`, `family_name`, `email`). The custom `getIdentity` only needs to return fields it wants to **override** — typically `roles` and `teams`.

| Field         | Type                             | Description                              |
| ------------- | -------------------------------- | ---------------------------------------- |
| `id`          | `string`                         | User ID (default: `custom:id` or `sub`)  |
| `displayName` | `string`                         | Display name (default: from name claims) |
| `roles`       | `string[]`                       | Webiny roles by slug                     |
| `teams`       | `string[]`                       | Webiny teams by slug                     |
| `profile`     | `{ email, firstName, lastName }` | User profile (defaults from claims)      |

## Full Examples

### Example 1: Simple Federation (No Extension Files)

```tsx
// webiny.config.tsx
import { Cognito } from "@webiny/cognito";

<Cognito
  federation={{
    domain: "my-app",
    callbackUrls: ["http://localhost:3001", "https://admin.example.com"],
    responseType: "code",
    identityProviders: [
      {
        type: "google",
        label: "Sign in with Google",
        providerDetails: {
          authorize_scopes: "email profile openid",
          client_id: String(process.env.GOOGLE_CLIENT_ID),
          client_secret: String(process.env.GOOGLE_CLIENT_SECRET)
        }
      }
    ]
  }}
/>;
```

This alone creates the Cognito IdP, configures OAuth, shows a "Sign in with Google" button, and auto-syncs federated users.

### Example 2: OIDC Provider (Entra ID / Custom)

```tsx
<Cognito
  federation={{
    domain: "my-app",
    callbackUrls: ["http://localhost:3001"],
    responseType: "code",
    allowCredentialsLogin: false,
    identityProviders: [
      {
        name: "EntraID",
        type: "oidc",
        label: "Sign in with Microsoft",
        providerDetails: {
          attributes_request_method: "POST",
          authorize_scopes: "email profile openid",
          client_id: String(process.env.ENTRA_CLIENT_ID),
          client_secret: String(process.env.ENTRA_CLIENT_SECRET),
          oidc_issuer: String(process.env.ENTRA_ISSUER)
        }
      }
    ]
  }}
/>
```

### Example 3: Async Federation Config

When provider credentials need to be fetched asynchronously (e.g., from a secrets manager, vault, or remote API), pass `federation` as an async function instead of a plain object. The config rendering pipeline will wait for the promise to resolve before continuing.

```tsx
// extensions/idp/entraid/Extension.tsx
import React from "react";
import { Cognito } from "@webiny/cognito";

async function getCredentials() {
  return {
    client_id: process.env.ENTRA_CLIENT_ID,
    client_secret: process.env.ENTRA_CLIENT_SECRET,
    oidc_issuer: process.env.ENTRA_OIDC_ISSUER
  };
}

export const CognitoFederation = () => {
  return (
    <Cognito
      mfa={true}
      apiConfig={"@/extensions/idp/entraid/EntraIdApiConfig.ts"}
      federation={async () => {
        const credentials = await getCredentials();

        return {
          domain: "myproj-webiny-with-entraid",
          callbackUrls: ["https://webiny-6.4.x.localhost"],
          responseType: "code",
          allowCredentialsLogin: true,
          identityProviders: [
            {
              name: "EntraID",
              type: "oidc",
              label: "Sign in with Microsoft",
              providerDetails: {
                attributes_request_method: "POST",
                authorize_scopes: "email profile openid",
                ...credentials
              },
              attributeMapping: {
                "custom:id": "sub",
                username: "sub",
                email: "email",
                given_name: "given_name",
                family_name: "family_name",
                preferred_username: "email"
              }
            }
          ]
        };
      }}
    />
  );
};
```

Under the hood, the `<Cognito>` component uses `<Await fn={...}>` from `@webiny/react-properties` to resolve the async function. The `AsyncProperties` wrapper in the config rendering worker gates `onChange` until all `<Await>` promises settle, so the CLI won't exit prematurely.

### Example 4: Multiple Providers

```tsx
<Cognito
  federation={{
    domain: "my-app",
    callbackUrls: ["http://localhost:3001"],
    responseType: "code",
    identityProviders: [
      {
        type: "google",
        label: "Sign in with Google",
        providerDetails: {
          authorize_scopes: "email profile openid",
          client_id: String(process.env.GOOGLE_CLIENT_ID),
          client_secret: String(process.env.GOOGLE_CLIENT_SECRET)
        }
      },
      {
        name: "EntraID",
        type: "oidc",
        label: "Sign in with Microsoft",
        providerDetails: {
          attributes_request_method: "POST",
          authorize_scopes: "email profile openid",
          client_id: String(process.env.ENTRA_CLIENT_ID),
          client_secret: String(process.env.ENTRA_CLIENT_SECRET),
          oidc_issuer: String(process.env.ENTRA_ISSUER)
        }
      }
    ]
  }}
/>
```

### Example 5: Custom Identity Mapping (apiConfig)

Map Cognito groups to Webiny roles/teams:

```tsx
// webiny.config.tsx
<Cognito federation={{/* ... */}} apiConfig={"/extensions/cognito/api.ts"} />
```

```ts
// extensions/cognito/api.ts
import { CognitoIdpConfig } from "@webiny/cognito/api";

class MyConfig implements CognitoIdpConfig.Interface {
  getIdentity(token: CognitoIdpConfig.JwtPayload) {
    const cognitoGroups: string[] = (token["cognito:groups"] as string[]) || [];

    return {
      roles: cognitoGroups.includes("admins") ? ["full-access"] : ["content-editor"],
      teams: cognitoGroups.filter(g => g.startsWith("team-"))
    };
  }
}

export default CognitoIdpConfig.createImplementation({
  implementation: MyConfig,
  dependencies: []
});
```

### Example 6: Custom Admin Login Screen (adminConfig)

#### IP-based credentials whitelist

```tsx
// webiny.config.tsx
<Cognito federation={{/* ... */}} adminConfig={"/extensions/cognito/admin.tsx"} />
```

```tsx
// extensions/cognito/admin.tsx
import { CognitoSignInConfig } from "@webiny/cognito/admin";

const ALLOWED_IPS = ["1.2.3.4", "5.6.7.8"];

async function fetchUserIP(): Promise<string> {
  const response = await fetch("https://api64.ipify.org?format=json");
  const data = await response.json();
  return data.ip;
}

class MyFederationConfig implements CognitoSignInConfig.Interface {
  async getConfig() {
    let allowCredentials = false;

    if (process.env.REACT_APP_STAGE !== "prod") {
      const ip = await fetchUserIP();
      allowCredentials = ALLOWED_IPS.includes(ip);
    }

    return {
      oauth: {
        scopes: ["profile", "email", "openid"],
        redirectSignIn: [window.location.origin],
        redirectSignOut: [window.location.origin],
        responseType: "code" as const
      },
      allowCredentialsLogin: allowCredentials,
      providers: [{ name: "EntraID", label: "Sign in with Microsoft" }],
      title: "Welcome"
    };
  }
}

export default CognitoSignInConfig.createImplementation({
  implementation: MyFederationConfig,
  dependencies: []
});
```

#### Custom button component

```tsx
// extensions/cognito/admin.tsx
import { CognitoSignInConfig } from "@webiny/cognito/admin";
import { GoogleLoginButton } from "react-social-login-buttons";

class MyFederationConfig implements CognitoSignInConfig.Interface {
  async getConfig() {
    return {
      oauth: {
        scopes: ["profile", "email", "openid"],
        redirectSignIn: [window.location.origin],
        redirectSignOut: [window.location.origin],
        responseType: "code" as const
      },
      allowCredentialsLogin: true,
      providers: [
        {
          name: "google",
          component: ({ signIn }) => <GoogleLoginButton onClick={signIn} />
        }
      ]
    };
  }
}

export default CognitoSignInConfig.createImplementation({
  implementation: MyFederationConfig,
  dependencies: []
});
```

#### Custom title and description

```tsx
class MyFederationConfig implements CognitoSignInConfig.Interface {
  async getConfig() {
    return {
      oauth: {/* ... */},
      allowCredentialsLogin: false,
      providers: [{ name: "EntraID", label: "Sign In" }],
      title: "Company Portal",
      description: "Use your corporate credentials to sign in."
    };
  }
}
```

### Example 7: Custom Attribute Mapping

Override the default OIDC attribute mapping when your IdP uses non-standard claim names.

The `custom:id` mapping is important — Webiny uses it as the primary user identifier. It's mapped to the IdP's `sub` claim by default. Always include it in custom mappings unless the IdP's `sub` value exceeds 36 characters on an existing Cognito pool (deployed prior to Webiny 6.4.4). New pools support up to 256 characters.

```tsx
<Cognito
  federation={{
    domain: "my-app",
    callbackUrls: ["http://localhost:3001"],
    identityProviders: [
      {
        name: "MyIDP",
        type: "oidc",
        label: "Sign in with MyIDP",
        providerDetails: {
          authorize_scopes: "email profile openid",
          client_id: "...",
          client_secret: "...",
          oidc_issuer: "..."
        },
        attributeMapping: {
          "custom:id": "sub",
          username: "sub",
          email: "email",
          given_name: "first_name",
          family_name: "last_name"
        }
      }
    ]
  }}
/>
```

## MFA (Multi-Factor Authentication)

Enable TOTP-based MFA for all admin users with `mfa={true}`:

```tsx
<Cognito mfa={true} />
```

Or combine with federation:

```tsx
<Cognito
  mfa={true}
  federation={{
    domain: "my-app",
    callbackUrls: ["http://localhost:3001"],
    identityProviders: [
      {
        name: "EntraID",
        type: "oidc",
        label: "Sign in with Microsoft",
        providerDetails: {/* ... */}
      }
    ]
  }}
/>
```

When MFA is enabled:

- The Cognito User Pool requires TOTP for all users (`mfaConfiguration: "ON"`)
- On first login, users see a TOTP setup screen with a QR code to scan with their authenticator app (Google Authenticator, Authy, etc.)
- On subsequent logins, users enter a 6-digit code from their authenticator app
- MFA applies to password-based logins only — federated IdP logins are handled by the external provider

## Quick Reference

### Imports

```typescript
// Extension component
import { Cognito } from "@webiny/cognito";

// API identity mapping
import { CognitoIdpConfig } from "@webiny/cognito/api";

// Admin login customization
import { CognitoSignInConfig } from "@webiny/cognito/admin";
```

### Key Interfaces

| Interface                               | Package                 | Purpose                                   |
| --------------------------------------- | ----------------------- | ----------------------------------------- |
| `CognitoIdpConfig.Interface`            | `@webiny/cognito/api`   | API-side JWT-to-identity mapping          |
| `CognitoIdpConfig.JwtPayload`           | `@webiny/cognito/api`   | JWT token payload type                    |
| `CognitoSignInConfig.Interface`         | `@webiny/cognito/admin` | Admin login screen customization          |
| `CognitoSignInConfig.FederatedProvider` | `@webiny/cognito/admin` | Provider button type (label or component) |

### File Structure (Advanced)

```
extensions/cognito/
├── api.ts       # API config (identity mapping) — optional
└── admin.tsx    # Admin config (login customization) — optional
```

### Deploy

```bash
yarn webiny deploy        # Deploy all (Core + API + Admin)
```

Core must be deployed first (creates IdP resources), then API + Admin.

## Related Skills

- **webiny-configure-entraid** — Specific guide for Microsoft Entra ID federation
- **webiny-configure-okta** — Alternative: Okta replaces Cognito entirely
- **webiny-configure-auth0** — Alternative: Auth0 replaces Cognito entirely
- **webiny-dependency-injection** — The DI pattern used by `createImplementation()`
