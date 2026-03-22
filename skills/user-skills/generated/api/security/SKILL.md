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
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `AfterAuthenticationEventHandler`
**Import:** `webiny/api/security/authentication`
**Source:** `@webiny/api-core/features/security/authentication/AuthenticationContext/index.ts`
**Description:** Hook into authentication lifecycle after authentication occurs.

---
**Name:** `ApiKeyAfterCreateEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts`
**Description:** Hook into API key lifecycle after an API key is created.

---
**Name:** `ApiKeyAfterDeleteEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts`
**Description:** Hook into API key lifecycle after an API key is deleted.

---
**Name:** `ApiKeyAfterUpdateEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts`
**Description:** Hook into API key lifecycle after an API key is updated.

---
**Name:** `ApiKeyBeforeCreateEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts`
**Description:** Hook into API key lifecycle before an API key is created.

---
**Name:** `ApiKeyBeforeDeleteEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts`
**Description:** Hook into API key lifecycle before an API key is deleted.

---
**Name:** `ApiKeyBeforeUpdateEventHandler`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts`
**Description:** Hook into API key lifecycle before an API key is updated.

---
**Name:** `ApiKeyFactory`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/shared/abstractions.ts`
**Description:** Provide code-defined API keys.

---
**Name:** `ApiKeyFactory`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/apiKeys/shared/abstractions.ts`
**Description:** Provide code-defined API keys.

---
**Name:** `ApiToken`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/domain/security/ApiToken.ts`
**Description:** Represents an API token identity.

---
**Name:** `Authenticator`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/authentication/Authenticator/abstractions.ts`
**Description:** Convert an authentication token into identity data.

---
**Name:** `Authorizer`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/authorization/Authorizer/index.ts`
**Description:** Retrieve permissions for an identity.

---
**Name:** `BeforeAuthenticationEventHandler`
**Import:** `webiny/api/security/authentication`
**Source:** `@webiny/api-core/features/security/authentication/AuthenticationContext/index.ts`
**Description:** Hook into authentication lifecycle before authentication occurs.

---
**Name:** `CreateApiKeyUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts`
**Description:** Create a new API key.

---
**Name:** `CreateRoleUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/CreateRole/index.ts`
**Description:** Create a new security role.

---
**Name:** `CreateUserUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/CreateUser/index.ts`
**Description:** Create a new admin user.

---
**Name:** `DeleteApiKeyUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts`
**Description:** Delete an API key.

---
**Name:** `DeleteRoleUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/DeleteRole/index.ts`
**Description:** Delete a security role.

---
**Name:** `DeleteUserUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/DeleteUser/index.ts`
**Description:** Delete an admin user.

---
**Name:** `GetApiKeyByTokenUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/GetApiKeyByToken/index.ts`
**Description:** Retrieve an API key by its token value.

---
**Name:** `GetApiKeyUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/GetApiKey/index.ts`
**Description:** Retrieve an API key by ID.

---
**Name:** `GetRoleUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/GetRole/index.ts`
**Description:** Retrieve a security role.

---
**Name:** `GetUserUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/GetUser/index.ts`
**Description:** Retrieve an admin user.

---
**Name:** `Identity`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/IdentityContext/index.ts`
**Description:** Abstract base class for all identity types.
Provides a common interface for identity checks across the codebase.

---
**Name:** `IdentityContext`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/IdentityContext/index.ts`
**Description:** Provides access to the current identity and its permissions.

---
**Name:** `IdentityProvider`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/idp/index.ts`
**Description:** Generic identity provider for token-based authentication.

---
**Name:** `JwtIdentityProvider`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/idp/index.ts`
**Description:** JWT-specific identity provider for token validation.

---
**Name:** `ListApiKeysUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/ListApiKeys/index.ts`
**Description:** List all API keys.

---
**Name:** `ListRolesUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/ListRoles/index.ts`
**Description:** List all security roles.

---
**Name:** `ListUsersUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/ListUsers/index.ts`
**Description:** List all admin users.

---
**Name:** `ListUserTeamsUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/ListUserTeams/index.ts`
**Description:** List teams assigned to a user.

---
**Name:** `OidcIdentityProvider`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/idp/index.ts`
**Description:** OIDC-compliant identity provider with issuer validation.

---
**Name:** `RoleAfterCreateEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/CreateRole/index.ts`
**Description:** Hook into role lifecycle after a role is created.

---
**Name:** `RoleAfterDeleteEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/DeleteRole/index.ts`
**Description:** Hook into role lifecycle after a role is deleted.

---
**Name:** `RoleAfterUpdateEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/UpdateRole/index.ts`
**Description:** Hook into role lifecycle after a role is updated.

---
**Name:** `RoleBeforeCreateEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/CreateRole/index.ts`
**Description:** Hook into role lifecycle before a role is created.

---
**Name:** `RoleBeforeDeleteEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/DeleteRole/index.ts`
**Description:** Hook into role lifecycle before a role is deleted.

---
**Name:** `RoleBeforeUpdateEventHandler`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/UpdateRole/index.ts`
**Description:** Hook into role lifecycle before a role is updated.

---
**Name:** `RoleFactory`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/roles/shared/abstractions.ts`
**Description:** Provide code-defined security roles with permissions.

---
**Name:** `TeamFactory`
**Import:** `webiny/api/security`
**Source:** `@webiny/api-core/features/security/teams/shared/abstractions.ts`
**Description:** Provide code-defined teams.

---
**Name:** `UpdateApiKeyUseCase`
**Import:** `webiny/api/security/api-key`
**Source:** `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts`
**Description:** Update an existing API key.

---
**Name:** `UpdateRoleUseCase`
**Import:** `webiny/api/security/role`
**Source:** `@webiny/api-core/features/security/roles/UpdateRole/index.ts`
**Description:** Update an existing security role.

---
**Name:** `UpdateUserUseCase`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/UpdateUser/index.ts`
**Description:** Update an existing admin user.

---
**Name:** `UserAfterCreateEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/CreateUser/index.ts`
**Description:** Hook into user lifecycle after a user is created.

---
**Name:** `UserAfterDeleteEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/DeleteUser/index.ts`
**Description:** Hook into user lifecycle after a user is deleted.

---
**Name:** `UserAfterUpdateEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/UpdateUser/index.ts`
**Description:** Hook into user lifecycle after a user is updated.

---
**Name:** `UserBeforeCreateEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/CreateUser/index.ts`
**Description:** Hook into user lifecycle before a user is created.

---
**Name:** `UserBeforeDeleteEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/DeleteUser/index.ts`
**Description:** Hook into user lifecycle before a user is deleted.

---
**Name:** `UserBeforeUpdateEventHandler`
**Import:** `webiny/api/security/user`
**Source:** `@webiny/api-core/features/users/UpdateUser/index.ts`
**Description:** Hook into user lifecycle before a user is updated.

---
