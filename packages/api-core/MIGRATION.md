# API Core Package Consolidation

This document describes the consolidation of four packages into `@webiny/api-core`:
- `@webiny/api-tenancy`
- `@webiny/api-security`
- `@webiny/api-system`
- `@webiny/api-admin-users`

## Migration Summary

### Directory Structure

```
packages/api-core/src/
├── features/
│   ├── tenancy/              # From api-tenancy
│   │   ├── TenantContext/
│   │   ├── CreateTenant/
│   │   ├── UpdateTenant/
│   │   ├── DeleteTenant/
│   │   ├── GetTenantById/
│   │   ├── GetRootTenant/
│   │   ├── ListTenants/
│   │   ├── InstallTenant/
│   │   └── shared/
│   ├── system/               # From api-system
│   │   └── InstallSystem/
│   ├── security/             # From api-security
│   │   ├── authentication/
│   │   ├── authorization/
│   │   ├── IdentityContext/
│   │   ├── apiKeys/
│   │   ├── groups/
│   │   ├── teams/
│   │   ├── tenantLinks/
│   │   ├── plugins/
│   │   └── utils/
│   └── users/                # From api-admin-users
│       ├── CreateUser/
│       ├── UpdateUser/
│       ├── DeleteUser/
│       ├── GetUser/
│       ├── ListUsers/
│       ├── ListUserTeams/
│       ├── ExternalIdpUserSync/
│       └── shared/
├── graphql/
│   ├── tenancy/
│   ├── system/
│   ├── security/
│   └── users/
├── legacy/
│   ├── tenancy/
│   ├── security/
│   └── users/
├── types/
│   ├── tenancy.ts
│   ├── security.ts
│   └── users.ts
├── createTenancyContext.ts
├── createSystemContext.ts
├── createSecurityContext.ts
└── createAdminUsersContext.ts
```

### Test Structure

```
packages/api-core/__tests__/
├── tenancy/                  # From api-tenancy/__tests__
├── security/                 # From api-security/__tests__
└── users/                    # From api-admin-users/__tests__ (no tests found)
```

### Features Consolidated

**Tenancy (8 features):**
- TenantContext, CreateTenant, UpdateTenant, DeleteTenant
- GetTenantById, GetRootTenant, ListTenants, InstallTenant

**System (1 feature):**
- InstallSystem

**Security (32 features):**
- Authentication & Authorization contexts
- Identity management
- API Keys (6 use cases)
- Groups (5 use cases + installer)
- Teams (5 use cases)
- Tenant Links (7 use cases + event handlers)
- Security plugins (9 plugins)
- Security utilities

**Admin Users (7 features):**
- CreateUser, UpdateUser, DeleteUser
- GetUser, ListUsers, ListUserTeams
- ExternalIdpUserSync

**Total: ~48 features**

### Package Exports

All feature exports are preserved with updated paths:
- `@webiny/api-core/features/security/IdentityContext`
- `@webiny/api-core/features/security/groups/CreateGroup`
- `@webiny/api-core/features/users/CreateUser`
- etc.

### Dependencies Consolidated

All dependencies from the four packages have been merged into api-core's package.json.

### Key Changes from Original Plan

- **ACO excluded**: The `api-aco` package was NOT included in the consolidation due to dependencies on non-core packages (api-headless-cms, api-file-manager, etc.). It remains a separate package.
- **Admin Users included**: The `api-admin-users` package was added to the consolidation as it fits well with the security context and is a core package.

### Next Steps

1. Update import statements across the codebase from old packages to `@webiny/api-core`
2. Remove old packages (api-tenancy, api-security, api-system, api-admin-users)
3. Update tsconfig references
4. Run tests to verify everything works
5. Update documentation and references to the old package names
