---
name: webiny-api-security-catalog
context: webiny-api
description: >
  API — Security & Auth — 49 abstractions.
  Authentication, API keys, roles, users, teams event handlers and use cases.
---

# API — Security & Auth

Authentication, API keys, roles, users, teams event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Class:** `AfterAuthenticationEventHandler`
**Import:** `webiny/api/security/authentication`
**Source:** `@webiny/api-core/features/security/authentication/AuthenticationContext/index.ts`
**Description:** Hook into authentication lifecycle after authentication occurs.

---
**Class:** `ApiKeyAfterCreateEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts`
**Description:** Hook into API key lifecycle after an API key is created.

---
**Class:** `ApiKeyAfterDeleteEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts`
**Description:** Hook into API key lifecycle after an API key is deleted.

---
**Class:** `ApiKeyAfterUpdateEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts`
**Description:** Hook into API key lifecycle after an API key is updated.

---
**Class:** `ApiKeyBeforeCreateEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts`
**Description:** Hook into API key lifecycle before an API key is created.

---
**Class:** `ApiKeyBeforeDeleteEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts`
**Description:** Hook into API key lifecycle before an API key is deleted.

---
**Class:** `ApiKeyBeforeUpdateEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts`
**Description:** Hook into API key lifecycle before an API key is updated.

---
**Class:** `ApiKeyFactory`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/shared/abstractions.ts`
**Description:** Provide code-defined API keys.

---
**Class:** `ApiKeyFactory`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/apiKeys/shared/abstractions.ts`
**Description:** Provide code-defined API keys.

---
**Class:** `ApiToken`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/domain/security/ApiToken.ts`
**Description:** Represents an API token identity.

---
**Class:** `Authenticator`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/authentication/Authenticator/abstractions.ts`
**Description:** Convert an authentication token into identity data.

---
**Class:** `Authorizer`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/authorization/Authorizer/index.ts`
**Description:** Retrieve permissions for an identity.

---
**Class:** `BeforeAuthenticationEventHandler`
**Import:** `webiny/api/security/authentication`
**Source:** `@webiny/api-core/features/security/authentication/AuthenticationContext/index.ts`
**Description:** Hook into authentication lifecycle before authentication occurs.

---
**Class:** `CreateApiKeyUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts`
**Description:** Create a new API key.

---
**Class:** `CreateRoleUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/CreateRole/index.ts`
**Description:** Create a new security role.

---
**Class:** `CreateUserUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/CreateUser/index.ts`
**Description:** Create a new admin user.

---
**Class:** `DeleteApiKeyUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts`
**Description:** Delete an API key.

---
**Class:** `DeleteRoleUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/DeleteRole/index.ts`
**Description:** Delete a security role.

---
**Class:** `DeleteUserUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/DeleteUser/index.ts`
**Description:** Delete an admin user.

---
**Class:** `GetApiKeyByTokenUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/GetApiKeyByToken/index.ts`
**Description:** Retrieve an API key by its token value.

---
**Class:** `GetApiKeyUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/GetApiKey/index.ts`
**Description:** Retrieve an API key by ID.

---
**Class:** `GetRoleUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/GetRole/index.ts`
**Description:** Retrieve a security role.

---
**Class:** `GetUserUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/GetUser/index.ts`
**Description:** Retrieve an admin user.

---
**Class:** `Identity`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/IdentityContext/index.ts`
**Description:** Abstract base class for all identity types.
Provides a common interface for identity checks across the codebase.

---
**Class:** `IdentityContext`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/IdentityContext/index.ts`
**Description:** Provides access to the current identity and its permissions.

---
**Class:** `IdentityProvider`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/idp/index.ts`
**Description:** Generic identity provider for token-based authentication.

---
**Class:** `JwtIdentityProvider`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/idp/index.ts`
**Description:** JWT-specific identity provider for token validation.

---
**Class:** `ListApiKeysUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/ListApiKeys/index.ts`
**Description:** List all API keys.

---
**Class:** `ListRolesUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/ListRoles/index.ts`
**Description:** List all security roles.

---
**Class:** `ListUsersUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/ListUsers/index.ts`
**Description:** List all admin users.

---
**Class:** `ListUserTeamsUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/ListUserTeams/index.ts`
**Description:** List teams assigned to a user.

---
**Class:** `OidcIdentityProvider`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/idp/index.ts`
**Description:** OIDC-compliant identity provider with issuer validation.

---
**Class:** `RoleAfterCreateEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/CreateRole/index.ts`
**Description:** Hook into role lifecycle after a role is created.

---
**Class:** `RoleAfterDeleteEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/DeleteRole/index.ts`
**Description:** Hook into role lifecycle after a role is deleted.

---
**Class:** `RoleAfterUpdateEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/UpdateRole/index.ts`
**Description:** Hook into role lifecycle after a role is updated.

---
**Class:** `RoleBeforeCreateEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/CreateRole/index.ts`
**Description:** Hook into role lifecycle before a role is created.

---
**Class:** `RoleBeforeDeleteEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/DeleteRole/index.ts`
**Description:** Hook into role lifecycle before a role is deleted.

---
**Class:** `RoleBeforeUpdateEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/UpdateRole/index.ts`
**Description:** Hook into role lifecycle before a role is updated.

---
**Class:** `RoleFactory`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/roles/shared/abstractions.ts`
**Description:** Provide code-defined security roles with permissions.

---
**Class:** `TeamFactory`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/teams/shared/abstractions.ts`
**Description:** Provide code-defined teams.

---
**Class:** `UpdateApiKeyUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts`
**Description:** Update an existing API key.

---
**Class:** `UpdateRoleUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/UpdateRole/index.ts`
**Description:** Update an existing security role.

---
**Class:** `UpdateUserUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/UpdateUser/index.ts`
**Description:** Update an existing admin user.

---
**Class:** `UserAfterCreateEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/CreateUser/index.ts`
**Description:** Hook into user lifecycle after a user is created.

---
**Class:** `UserAfterDeleteEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/DeleteUser/index.ts`
**Description:** Hook into user lifecycle after a user is deleted.

---
**Class:** `UserAfterUpdateEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/UpdateUser/index.ts`
**Description:** Hook into user lifecycle after a user is updated.

---
**Class:** `UserBeforeCreateEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/CreateUser/index.ts`
**Description:** Hook into user lifecycle before a user is created.

---
**Class:** `UserBeforeDeleteEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/DeleteUser/index.ts`
**Description:** Hook into user lifecycle before a user is deleted.

---
**Class:** `UserBeforeUpdateEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/UpdateUser/index.ts`
**Description:** Hook into user lifecycle before a user is updated.

---
