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

1. Find the abstraction you need in the table below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

| Class | Import | Source |
|-------|--------|--------|
| `AfterAuthenticationEventHandler` | `webiny/api/security/authentication` | `@webiny/api-core/features/security/authentication/AuthenticationContext/index.ts` |
| `ApiKeyAfterCreateEventHandler` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts` |
| `ApiKeyAfterDeleteEventHandler` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts` |
| `ApiKeyAfterUpdateEventHandler` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts` |
| `ApiKeyBeforeCreateEventHandler` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts` |
| `ApiKeyBeforeDeleteEventHandler` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts` |
| `ApiKeyBeforeUpdateEventHandler` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts` |
| `ApiKeyFactory` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/shared/abstractions.ts` |
| `ApiKeyFactory` | `webiny/api/security` | `@webiny/api-core/features/security/apiKeys/shared/abstractions.ts` |
| `ApiToken` | `webiny/api/security` | `@webiny/api-core/domain/security/ApiToken.ts` |
| `Authenticator` | `webiny/api/security` | `@webiny/api-core/features/security/authentication/Authenticator/abstractions.ts` |
| `Authorizer` | `webiny/api/security` | `@webiny/api-core/features/security/authorization/Authorizer/index.ts` |
| `BeforeAuthenticationEventHandler` | `webiny/api/security/authentication` | `@webiny/api-core/features/security/authentication/AuthenticationContext/index.ts` |
| `CreateApiKeyUseCase` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.ts` |
| `CreateRoleUseCase` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/CreateRole/index.ts` |
| `CreateUserUseCase` | `webiny/api/security/user` | `@webiny/api-core/features/users/CreateUser/index.ts` |
| `DeleteApiKeyUseCase` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.ts` |
| `DeleteRoleUseCase` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/DeleteRole/index.ts` |
| `DeleteUserUseCase` | `webiny/api/security/user` | `@webiny/api-core/features/users/DeleteUser/index.ts` |
| `GetApiKeyByTokenUseCase` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/GetApiKeyByToken/index.ts` |
| `GetApiKeyUseCase` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/GetApiKey/index.ts` |
| `GetRoleUseCase` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/GetRole/index.ts` |
| `GetUserUseCase` | `webiny/api/security/user` | `@webiny/api-core/features/users/GetUser/index.ts` |
| `Identity` | `webiny/api/security` | `@webiny/api-core/features/security/IdentityContext/index.ts` |
| `IdentityContext` | `webiny/api/security` | `@webiny/api-core/features/security/IdentityContext/index.ts` |
| `IdentityProvider` | `webiny/api/security` | `@webiny/api-core/idp/index.ts` |
| `JwtIdentityProvider` | `webiny/api/security` | `@webiny/api-core/idp/index.ts` |
| `ListApiKeysUseCase` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/ListApiKeys/index.ts` |
| `ListRolesUseCase` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/ListRoles/index.ts` |
| `ListUsersUseCase` | `webiny/api/security/user` | `@webiny/api-core/features/users/ListUsers/index.ts` |
| `ListUserTeamsUseCase` | `webiny/api/security/user` | `@webiny/api-core/features/users/ListUserTeams/index.ts` |
| `OidcIdentityProvider` | `webiny/api/security` | `@webiny/api-core/idp/index.ts` |
| `RoleAfterCreateEventHandler` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/CreateRole/index.ts` |
| `RoleAfterDeleteEventHandler` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/DeleteRole/index.ts` |
| `RoleAfterUpdateEventHandler` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/UpdateRole/index.ts` |
| `RoleBeforeCreateEventHandler` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/CreateRole/index.ts` |
| `RoleBeforeDeleteEventHandler` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/DeleteRole/index.ts` |
| `RoleBeforeUpdateEventHandler` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/UpdateRole/index.ts` |
| `RoleFactory` | `webiny/api/security` | `@webiny/api-core/features/security/roles/shared/abstractions.ts` |
| `TeamFactory` | `webiny/api/security` | `@webiny/api-core/features/security/teams/shared/abstractions.ts` |
| `UpdateApiKeyUseCase` | `webiny/api/security/api-key` | `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.ts` |
| `UpdateRoleUseCase` | `webiny/api/security/role` | `@webiny/api-core/features/security/roles/UpdateRole/index.ts` |
| `UpdateUserUseCase` | `webiny/api/security/user` | `@webiny/api-core/features/users/UpdateUser/index.ts` |
| `UserAfterCreateEventHandler` | `webiny/api/security/user` | `@webiny/api-core/features/users/CreateUser/index.ts` |
| `UserAfterDeleteEventHandler` | `webiny/api/security/user` | `@webiny/api-core/features/users/DeleteUser/index.ts` |
| `UserAfterUpdateEventHandler` | `webiny/api/security/user` | `@webiny/api-core/features/users/UpdateUser/index.ts` |
| `UserBeforeCreateEventHandler` | `webiny/api/security/user` | `@webiny/api-core/features/users/CreateUser/index.ts` |
| `UserBeforeDeleteEventHandler` | `webiny/api/security/user` | `@webiny/api-core/features/users/DeleteUser/index.ts` |
| `UserBeforeUpdateEventHandler` | `webiny/api/security/user` | `@webiny/api-core/features/users/UpdateUser/index.ts` |
