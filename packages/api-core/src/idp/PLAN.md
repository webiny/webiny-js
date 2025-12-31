I need to implement an `IdpAuthenticator` using this abstraction `packages/api-core/src/features/security/authentication/Authenticator/abstractions.ts:8`.

The `IdpAuthenticator` should inject all registered IdpProviderFactory implementations, and process them one by one, till one applies (`isApplicable`) and .

Currently, this logic is heavily duplicated across 3 packages (3 IDPs, Auth0, Okta, Cognito):

- Cognito: `packages/api-security-cognito/src/createCognito.ts`, which uses `packages/api-cognito-authenticator/src/index.ts` (this logic is mostly duplicated across all IDP implementations).
- Auth0: `packages/api-security-auth0/src/createAuth0.ts`
- Okta: `packages/api-security-okta/src/createOkta.ts`

The goal of this IdpAuthenticator is to orchestrate authentication using the logic which is duplicated everywhere, and also automate discovery and verification of JWT tokens using JWKeys, using `.well-kknown/openid-configuration` endpoint of each config's `issuer` URL.

I've designed core abstractions to make it easier to add new IDP implementations down the line.

```ts
/**
 * The top level system abstraction is a simple `Authenticator`. It takes a string idToken, and needs to produce an `IdentityData`.
 * This is what Webiny cares about, and this is what it calls to resolve an identity.
 */
export interface IAuthenticator {
  authenticate(token: string): Promise<IdentityData | null>;
}

/**
 * Moving a level lower, we want to create an easy way to implement new identity providers.
 * Most of them are standard OIDC: Cognito, Okta, Auth0, Azure AD. For this, we have an Authenticator implementation
 * which uses the abstractions below, to orchestrate authentication.
 *
 * There are 2 types of IDPs. Full OIDC, and custom.
 *
 * 1) For OIDC implementations we'll expose a `OidcIdpConfigProvider` class which developers can use for fast implementation.
 * All the OIDC internals, token parsing, JWKeys validation is done within this generic OIDC provider. The `IdpConfig` implementation
 * is used by individual projects (end users) to configure their IDPs (Okta, Auth0), but the core IdpProvider implementation
 * is provided by me.
 *
 * To configure an IdpProvider, we need a Factory layer, because configuration can be async, depend on tenant, dynamic data, etc.
 * This is what `IdpConfigProviderFactory` is for. Authenticator implementation will inject these factories to get IDP provider instances.
 *
 * 2) Custom IdPs can be anything. Technically, for custom IDP implementations, we can just leave it on the Authenticator level.
 * I need a bit of input from your end on this.
 */

interface IdpProviderFactory {
  getIdpProvider(): Promise<IIdpProvider> | IIdpProvider;
}

interface IIdpProvider {
  // Determine whether the IdpConfigProvider can process the given JWT token.
  isApplicable(token: jwt.JwtPayload): boolean;

  // Return IdpConfig object.
  getIdentity(token: string): Promise<Identity.Data | null>;
}

interface IOidcIdpConfig {
  getIdentity(token: jwt.JwtPayload): Promise<Identity.Data> | Identity.Data;
  canAccessTenant(
    identity: Identity,
    tenant: Tenant
  ): Promise<boolean> | boolean;
  verifyTokenClaims?(
    jwt: jwt.JwtPayload
  ): Promise<jwt.JwtPayload> | jwt.JwtPayload;
  // If not using JWKeys, implement this method to verify the token signature.
  verifyToken?(jwt: string): Promise<jwt.JwtPayload> | jwt.JwtPayload;
}

// ----- OIDC implementations -----

// Each implementation will need to define its own config abstractions: OktaConfig, Auth0Config, etc., which extend the IOidcIdpConfig interface.
// These can extend the generic IIdpConfig interface, but we need to have physically separate abstractions in order to inject the right configs
// into the right provider factories.

// --- Okta ---
// Okta is a proper OIDC IdP and we can use the built-in `OidcIdpConfigProvider` to orchestrate the process.
class OktaIdpConfigProviderFactory {
  constructor(private oktaConfig: OktaIdpConfig.Interface) {}

  getIdpConfigProvider() {
    return new OidcIdpConfigProvider({
      issuer: process.env.OKTA_ISSUER,
      clientId: process.env.OKTA_CLIENT_ID,
      config: this.oktaConfig,
      isApplicable(token: jwt.JwtPayload) {
        const issuer = token.iss as string;

        return (
          issuer.includes("okta.com") || issuer.includes("oktapreview.com")
        );
      }
    });
  }
}

// --- Auth0 ---
// Auth0 is a proper OIDC IdP and we can use the built-in `OidcIdpConfigProvider` to orchestrate the process.
class Auth0IdpConfigProviderFactory {
  constructor(private auth0Config: Auth0IdpConfig.Interface) {}

  getIdpConfigProvider() {
    return new OidcIdpConfigProvider({
      issuer: process.env.AUTH0_ISSUER,
      clientId: process.env.AUTH0_CLIENT_ID,
      config: this.auth0Config,
      isApplicable(token: jwt.JwtPayload) {
        const issuer = token.iss as string;

        return issuer.includes("auth0.com");
      }
    });
  }
}
```
