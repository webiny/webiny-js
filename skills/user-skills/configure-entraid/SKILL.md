---
name: webiny-configure-entraid
description: >
  Configuring Microsoft Entra ID (formerly Azure AD) as a federated identity
  provider for Webiny projects using Cognito Federation. Use this skill when the
  developer asks about Entra ID, Azure AD, Microsoft SSO, OIDC with Microsoft,
  Microsoft login for Webiny, or configuring login.microsoftonline.com as an
  identity provider. Also relevant for tenant IDs, Entra application registration,
  or connecting Microsoft 365 accounts to Webiny.
---

# Configure Microsoft Entra ID Authentication

## TL;DR

Webiny supports Microsoft Entra ID (formerly Azure AD) as a federated identity provider through Cognito Federation. Unlike Okta or Auth0 which replace Cognito entirely, Entra ID works **alongside** Cognito — users authenticate via Microsoft, but Cognito remains the user pool. Configure it by adding `federation` to the `<Cognito />` extension in `webiny.config.tsx` with your Entra ID application's client ID, client secret, and issuer URL.

## Prerequisites

Before configuring Webiny, you need to register an application in the Microsoft Entra ID portal:

1. Go to [Microsoft Entra admin center](https://entra.microsoft.com) > **App registrations** > **New registration**
2. Set a name (e.g., "Webiny Admin")
3. Set **Supported account types** (typically "Accounts in this organizational directory only")
4. Set **Redirect URI**: Web — use your Cognito domain callback URL (you'll get this after the first deploy: `https://{domain}.auth.{region}.amazoncognito.com/oauth2/idpresponse`)
5. After registration, note:
   - **Application (client) ID** — this is your `client_id`
   - **Directory (tenant) ID** — part of your issuer URL
6. Go to **Certificates & secrets** > **New client secret** — note the **Value** (this is your `client_secret`)
7. The **Issuer URL** is: `https://login.microsoftonline.com/{tenant-id}/v2.0`

## Reference Tables

### Required Entra ID Values

| Value                   | Where to find it                          | Used as                              |
| ----------------------- | ----------------------------------------- | ------------------------------------ |
| Application (client) ID | App registration > Overview               | `client_id` in `providerDetails`     |
| Client secret value     | App registration > Certificates & secrets | `client_secret` in `providerDetails` |
| Directory (tenant) ID   | App registration > Overview               | Part of `oidc_issuer` URL            |

### Environment Variables

| Variable              | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `ENTRA_CLIENT_ID`     | Entra ID Application (client) ID                     |
| `ENTRA_CLIENT_SECRET` | Entra ID client secret value                         |
| `ENTRA_ISSUER`        | `https://login.microsoftonline.com/{tenant-id}/v2.0` |

### Attribute Mapping

When Cognito receives tokens from Entra ID, it maps the OIDC claims to Cognito user attributes. The default OIDC mapping is:

| Cognito Attribute    | OIDC Claim    | Description                        |
| -------------------- | ------------- | ---------------------------------- |
| `username`           | `sub`         | Unique user identifier             |
| `custom:id`          | `sub`         | Webiny internal user ID            |
| `email`              | `email`       | User's email address               |
| `given_name`         | `given_name`  | First name                         |
| `family_name`        | `family_name` | Last name                          |
| `preferred_username` | `email`       | Used as the Cognito username alias |

You can override this mapping with the `attributeMapping` property on the identity provider config. This is useful when:

- Your Entra ID uses non-standard claim names
- You want to skip `custom:id` mapping (e.g., when the `sub` value exceeds the attribute's max length on existing pools)
- You need to map additional custom attributes

```tsx
{
    name: "EntraID",
    type: "oidc",
    label: "Sign in with Microsoft",
    providerDetails: { /* ... */ },
    attributeMapping: {
        username: "sub",
        email: "email",
        given_name: "given_name",
        family_name: "family_name",
        preferred_username: "email"
        // custom:id intentionally omitted
    }
}
```

When `attributeMapping` is provided, it **replaces** the defaults entirely — include all mappings you need.

## Full Examples

### Example 1: Basic Entra ID Federation

**Step 1: Set environment variables**

Add to your `.env` file:

```
# NOTE: these are made up example values
ENTRA_CLIENT_ID=f62ee823-2811-8314-a040-62848442c0d5
ENTRA_CLIENT_SECRET=~Gp7Q~97MAzTAUyeTLzTVzX31DRTY28chehU6c_a
ENTRA_ISSUER=https://login.microsoftonline.com/1cd0d912-0ac4-48a0-91b6-cd849ce9498f/v2.0
```

**Step 2: Create the extension**

Create `extensions/entraid/Extension.tsx`:

```tsx
import React from "react";
import { Cognito } from "@webiny/cognito";

export const CognitoFederation = () => {
  return (
    <Cognito
      federation={{
        domain: "my-app-entraid",
        callbackUrls: ["http://localhost:3001"],
        responseType: "code",
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
  );
};
```

**Step 3: Register in `webiny.config.tsx`**

```tsx
import { CognitoFederation } from "@/extensions/entraid/Extension.js";

export const Extensions = () => {
  return (
    <>
      {/* Replace <Cognito /> with the federation extension */}
      <CognitoFederation />

      {/* ... other extensions ... */}
    </>
  );
};
```

**Step 4: Deploy**

```bash
# Deploy core first (creates Cognito IdP resources)
yarn webiny deploy core --env=dev

# Get the Cognito domain for Entra ID redirect URI config
yarn webiny output core --env=dev
# Look for cognitoUserPoolDomain — use it to update the redirect URI in Entra ID

# Deploy API + Admin
yarn webiny deploy api --env=dev
yarn webiny deploy admin --env=dev
```

**Step 5: Update Entra ID redirect URI**

After the first deploy, update the redirect URI in your Entra ID app registration to:
`https://{cognitoUserPoolDomain}/oauth2/idpresponse`

### Example 2: Entra ID Only (No Password Login)

```tsx
<Cognito
  federation={{
    domain: "my-app-entraid",
    callbackUrls: ["http://localhost:3001", "https://admin.example.com"],
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

This hides the email/password form and shows only the "Sign in with Microsoft" button with a description that the user will be redirected.

### Example 3: Entra ID with Custom Role Mapping

Map Entra ID groups (via Cognito groups or token claims) to Webiny roles:

```tsx
// webiny.config.tsx
<CognitoFederation />
// where CognitoFederation includes:
// apiConfig={"@/extensions/entraid/api.ts"}
```

```ts
// extensions/entraid/api.ts
import { CognitoIdpConfig } from "@webiny/cognito/api";

class EntraIdConfig implements CognitoIdpConfig.Interface {
  getIdentity(token: CognitoIdpConfig.JwtPayload) {
    const groups: string[] = (token["cognito:groups"] as string[]) || [];

    return {
      roles: groups.includes("WebinyAdmins") ? ["full-access"] : ["content-editor"],
      teams: groups.filter(g => g.startsWith("team-"))
    };
  }
}

export default CognitoIdpConfig.createImplementation({
  implementation: EntraIdConfig,
  dependencies: []
});
```

### Example 4: Production Setup with Multiple Callback URLs

```tsx
<Cognito
  federation={{
    domain: "mycompany-webiny",
    callbackUrls: ["http://localhost:3001", "https://admin.mycompany.com"],
    logoutUrls: ["http://localhost:3001", "https://admin.mycompany.com"],
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

Remember to add **all** callback URLs to your Entra ID app registration's redirect URIs.

### Example 5: Custom Attribute Mapping

Override the default claim mapping — useful for existing Cognito pools where `custom:id` has a max length of 36 characters (Entra ID `sub` values can be longer):

```tsx
<Cognito
  federation={{
    domain: "mycompany-webiny",
    callbackUrls: ["http://localhost:3001"],
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
        },
        attributeMapping: {
          username: "sub",
          email: "email",
          given_name: "given_name",
          family_name: "family_name",
          preferred_username: "email"
        }
      }
    ]
  }}
/>
```

### Example 6: Entra ID with MFA

Add TOTP-based MFA on top of Entra ID federation:

```tsx
<Cognito
  mfa={true}
  federation={{
    domain: "mycompany-webiny",
    callbackUrls: ["http://localhost:3001"],
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
  }}
/>
```

MFA applies to password-based logins. Federated sign-ins via Entra ID are handled by Microsoft's own authentication — configure MFA on the Entra ID side if needed for those users.

## Quick Reference

### Imports

```typescript
import { Cognito } from "@webiny/cognito";
import { CognitoIdpConfig } from "@webiny/cognito/api"; // for API config
import { CognitoSignInConfig } from "@webiny/cognito/admin"; // for Admin config
```

### File Structure

```
extensions/entraid/
├── Extension.tsx       # Extension component with <Cognito federation={...} />
├── api.ts              # API config (role mapping) — optional
└── admin.tsx           # Admin config (login customization) — optional
```

### Deploy Order

1. `yarn webiny deploy core --env=dev` — creates Cognito IdP resources
2. Update Entra ID redirect URI with the `cognitoUserPoolDomain` output
3. `yarn webiny deploy api --env=dev` — deploys API with identity mapping
4. `yarn webiny deploy admin --env=dev` — deploys admin with login screen

## Related Skills

- **webiny-cognito-federation** — Full reference for all Cognito Federation options
- **webiny-configure-okta** — Alternative: Okta replaces Cognito entirely
- **webiny-configure-auth0** — Alternative: Auth0 replaces Cognito entirely
