---
name: webiny-api-security-catalog
context: webiny-api
description: >
  API — Security & Auth — 52 abstractions.
  Authentication, API keys, roles, users, teams event handlers and use cases.
---

# API — Security & Auth

Authentication, API keys, roles, users, teams event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `AfterAuthenticationEventHandler`
**Import:** `import { AfterAuthenticationEventHandler } from "webiny/api/security/authentication"`
**Source:** `@webiny/api-core/features/security/authentication/AuthenticationContext/index.ts`
**Description:** Hook into authentication lifecycle after authentication occurs.

---

**Name:** `ApiKeyAfterCreateEventHandler`
**Import:** `import { ApiKeyAfterCreateEventHandler } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts`
**Description:** Hook into API key lifecycle after an API key is created.

---

**Name:** `ApiKeyAfterDeleteEventHandler`
**Import:** `import { ApiKeyAfterDeleteEventHandler } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts`
**Description:** Hook into API key lifecycle after an API key is deleted.

---

**Name:** `ApiKeyAfterUpdateEventHandler`
**Import:** `import { ApiKeyAfterUpdateEventHandler } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts`
**Description:** Hook into API key lifecycle after an API key is updated.

---

**Name:** `ApiKeyBeforeCreateEventHandler`
**Import:** `import { ApiKeyBeforeCreateEventHandler } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts`
**Description:** Hook into API key lifecycle before an API key is created.

---

**Name:** `ApiKeyBeforeDeleteEventHandler`
**Import:** `import { ApiKeyBeforeDeleteEventHandler } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts`
**Description:** Hook into API key lifecycle before an API key is deleted.

---

**Name:** `ApiKeyBeforeUpdateEventHandler`
**Import:** `import { ApiKeyBeforeUpdateEventHandler } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts`
**Description:** Hook into API key lifecycle before an API key is updated.

---

**Name:** `ApiKeyFactory`
**Import:** `import { ApiKeyFactory } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/shared/abstractions.ts`
**Description:** Provide code-defined API keys.

---

**Name:** `ApiKeyFactory`
**Import:** `import { ApiKeyFactory } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/apiKeys/shared/abstractions.ts`
**Description:** Provide code-defined API keys.

---

**Name:** `ApiToken`
**Import:** `import { ApiToken } from "webiny/api/security"`
**Source:** `@webiny/api-core/domain/security/ApiToken.ts`
**Description:** Represents an API token identity.

---

**Name:** `Authenticator`
**Import:** `import { Authenticator } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/authentication/Authenticator/abstractions.ts`
**Description:** Convert an authentication token into identity data.

---

**Name:** `Authorizer`
**Import:** `import { Authorizer } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/authorization/Authorizer/index.ts`
**Description:** Retrieve permissions for an identity.

---

**Name:** `BeforeAuthenticationEventHandler`
**Import:** `import { BeforeAuthenticationEventHandler } from "webiny/api/security/authentication"`
**Source:** `@webiny/api-core/features/security/authentication/AuthenticationContext/index.ts`
**Description:** Hook into authentication lifecycle before authentication occurs.

---

**Name:** `CreateApiKeyUseCase`
**Import:** `import { CreateApiKeyUseCase } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts`
**Description:** Create a new API key.

---

**Name:** `createPermissionsAbstraction`
**Import:** `import { createPermissionsAbstraction } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/permissions/index.ts`

---

**Name:** `createPermissionSchema`
**Import:** `import { createPermissionSchema } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/permissions/index.ts`

---

**Name:** `createPermissionsFeature`
**Import:** `import { createPermissionsFeature } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/permissions/index.ts`

---

**Name:** `CreateRoleUseCase`
**Import:** `import { CreateRoleUseCase } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/CreateRole/index.ts`
**Description:** Create a new security role.

---

**Name:** `CreateUserUseCase`
**Import:** `import { CreateUserUseCase } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/CreateUser/index.ts`
**Description:** Create a new admin user.

---

**Name:** `DeleteApiKeyUseCase`
**Import:** `import { DeleteApiKeyUseCase } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts`
**Description:** Delete an API key.

---

**Name:** `DeleteRoleUseCase`
**Import:** `import { DeleteRoleUseCase } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/DeleteRole/index.ts`
**Description:** Delete a security role.

---

**Name:** `DeleteUserUseCase`
**Import:** `import { DeleteUserUseCase } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/DeleteUser/index.ts`
**Description:** Delete an admin user.

---

**Name:** `GetApiKeyByTokenUseCase`
**Import:** `import { GetApiKeyByTokenUseCase } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/GetApiKeyByToken/index.ts`
**Description:** Retrieve an API key by its token value.

---

**Name:** `GetApiKeyUseCase`
**Import:** `import { GetApiKeyUseCase } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/GetApiKey/index.ts`
**Description:** Retrieve an API key by ID.

---

**Name:** `GetRoleUseCase`
**Import:** `import { GetRoleUseCase } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/GetRole/index.ts`
**Description:** Retrieve a security role.

---

**Name:** `GetUserUseCase`
**Import:** `import { GetUserUseCase } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/GetUser/index.ts`
**Description:** Retrieve an admin user.

---

**Name:** `Identity`
**Import:** `import { Identity } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/IdentityContext/index.ts`
**Description:** Abstract base class for all identity types.
Provides a common interface for identity checks across the codebase.

---

**Name:** `IdentityContext`
**Import:** `import { IdentityContext } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/IdentityContext/index.ts`
**Description:** Provides access to the current identity and its permissions.

---

**Name:** `IdentityProvider`
**Import:** `import { IdentityProvider } from "webiny/api/security"`
**Source:** `@webiny/api-core/idp/index.ts`
**Description:** Generic identity provider for token-based authentication.

---

**Name:** `JwtIdentityProvider`
**Import:** `import { JwtIdentityProvider } from "webiny/api/security"`
**Source:** `@webiny/api-core/idp/index.ts`
**Description:** JWT-specific identity provider for token validation.

---

**Name:** `ListApiKeysUseCase`
**Import:** `import { ListApiKeysUseCase } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/ListApiKeys/index.ts`
**Description:** List all API keys.

---

**Name:** `ListRolesUseCase`
**Import:** `import { ListRolesUseCase } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/ListRoles/index.ts`
**Description:** List all security roles.

---

**Name:** `ListUsersUseCase`
**Import:** `import { ListUsersUseCase } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/ListUsers/index.ts`
**Description:** List all admin users.

---

**Name:** `ListUserTeamsUseCase`
**Import:** `import { ListUserTeamsUseCase } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/ListUserTeams/index.ts`
**Description:** List teams assigned to a user.

---

**Name:** `OidcIdentityProvider`
**Import:** `import { OidcIdentityProvider } from "webiny/api/security"`
**Source:** `@webiny/api-core/idp/index.ts`
**Description:** OIDC-compliant identity provider with issuer validation.

---

**Name:** `RoleAfterCreateEventHandler`
**Import:** `import { RoleAfterCreateEventHandler } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/CreateRole/index.ts`
**Description:** Hook into role lifecycle after a role is created.

---

**Name:** `RoleAfterDeleteEventHandler`
**Import:** `import { RoleAfterDeleteEventHandler } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/DeleteRole/index.ts`
**Description:** Hook into role lifecycle after a role is deleted.

---

**Name:** `RoleAfterUpdateEventHandler`
**Import:** `import { RoleAfterUpdateEventHandler } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/UpdateRole/index.ts`
**Description:** Hook into role lifecycle after a role is updated.

---

**Name:** `RoleBeforeCreateEventHandler`
**Import:** `import { RoleBeforeCreateEventHandler } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/CreateRole/index.ts`
**Description:** Hook into role lifecycle before a role is created.

---

**Name:** `RoleBeforeDeleteEventHandler`
**Import:** `import { RoleBeforeDeleteEventHandler } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/DeleteRole/index.ts`
**Description:** Hook into role lifecycle before a role is deleted.

---

**Name:** `RoleBeforeUpdateEventHandler`
**Import:** `import { RoleBeforeUpdateEventHandler } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/UpdateRole/index.ts`
**Description:** Hook into role lifecycle before a role is updated.

---

**Name:** `RoleFactory`
**Import:** `import { RoleFactory } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/roles/shared/abstractions.ts`
**Description:** Provide code-defined security roles with permissions.

---

**Name:** `TeamFactory`
**Import:** `import { TeamFactory } from "webiny/api/security"`
**Source:** `@webiny/api-core/features/security/teams/shared/abstractions.ts`
**Description:** Provide code-defined teams.

---

**Name:** `UpdateApiKeyUseCase`
**Import:** `import { UpdateApiKeyUseCase } from "webiny/api/security/api-key"`
**Source:** `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts`
**Description:** Update an existing API key.

---

**Name:** `UpdateRoleUseCase`
**Import:** `import { UpdateRoleUseCase } from "webiny/api/security/role"`
**Source:** `@webiny/api-core/features/security/roles/UpdateRole/index.ts`
**Description:** Update an existing security role.

---

**Name:** `UpdateUserUseCase`
**Import:** `import { UpdateUserUseCase } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/UpdateUser/index.ts`
**Description:** Update an existing admin user.

---

**Name:** `UserAfterCreateEventHandler`
**Import:** `import { UserAfterCreateEventHandler } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/CreateUser/index.ts`
**Description:** Hook into user lifecycle after a user is created.

---

**Name:** `UserAfterDeleteEventHandler`
**Import:** `import { UserAfterDeleteEventHandler } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/DeleteUser/index.ts`
**Description:** Hook into user lifecycle after a user is deleted.

---

**Name:** `UserAfterUpdateEventHandler`
**Import:** `import { UserAfterUpdateEventHandler } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/UpdateUser/index.ts`
**Description:** Hook into user lifecycle after a user is updated.

---

**Name:** `UserBeforeCreateEventHandler`
**Import:** `import { UserBeforeCreateEventHandler } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/CreateUser/index.ts`
**Description:** Hook into user lifecycle before a user is created.

---

**Name:** `UserBeforeDeleteEventHandler`
**Import:** `import { UserBeforeDeleteEventHandler } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/DeleteUser/index.ts`
**Description:** Hook into user lifecycle before a user is deleted.

---

**Name:** `UserBeforeUpdateEventHandler`
**Import:** `import { UserBeforeUpdateEventHandler } from "webiny/api/security/user"`
**Source:** `@webiny/api-core/features/users/UpdateUser/index.ts`
**Description:** Hook into user lifecycle before a user is updated.

---
