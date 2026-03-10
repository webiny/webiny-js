# API Abstractions Registry

> **Scope:** This registry covers only the **API (Backend)** abstractions exported from `webiny/api/*`. Admin (Frontend) abstractions are not included here.

Last updated: 2026-03-10

## How to regenerate

1. The `webiny` package (`packages/webiny/src/api/`) is the public API surface.
2. All files under `packages/webiny/src/api/**/*.ts` re-export from internal packages.
3. Only exports that are `createAbstraction<...>()` or `new Abstraction<...>()` at source are injectables.
4. Non-abstraction exports (plain classes, types, abstract classes) are excluded.

### Quick diff command

```bash
# Find all export names from webiny/api
rg "export \{" packages/webiny/src/api --no-filename | sed 's/export {//;s/}.*//;s/,/\n/g' | sed 's/^ *//;s/ *$//' | sort -u > /tmp/webiny_exports.txt

# Find all createAbstraction definitions
rg "export const (\w+) = createAbstraction" -o -r '$1' --glob '*.ts' packages/ | sort -u > /tmp/all_abstractions.txt

# Cross-reference
comm -12 /tmp/webiny_exports.txt /tmp/all_abstractions.txt
```

## Non-abstraction exports (excluded from SKILL.md)

These are exported from `webiny/api/*` but are NOT Abstraction objects:

| Export | Import Path | What it is |
| --- | --- | --- |
| `DomainEvent` | `webiny/api/event-publisher` | Abstract class |
| `Identity` | `webiny/api/security` | Abstract class |
| `ApiToken` | `webiny/api/security` | Regular class with static methods |
| `EntryId` | `webiny/api/cms/entry` | Regular class |
| `ModelBuilder` | `webiny/api/cms/model` | Regular class |
| `FieldBuilder` | `webiny/api/cms/model` | Regular class |
| `LayoutBuilder` | `webiny/api/cms/model` | Regular class |
| `NotAuthorizedResponse` | `webiny/api/graphql` | Response class |
| `ErrorResponse` | `webiny/api/graphql` | Response class |
| `ListResponse` | `webiny/api/graphql` | Response class |
| `Response` | `webiny/api/graphql` | Response class |
| `NotFoundResponse` | `webiny/api/graphql` | Response class |
| `ListErrorResponse` | `webiny/api/graphql` | Response class |

## Full abstraction list by import path

Format: `ImportPath | AbstractionName | SourcePackage | SourceFile`

### webiny/api/build-params
| Abstraction | Source |
| --- | --- |
| `BuildParam` | `@webiny/api-core/features/buildParams/index.js` |
| `BuildParams` | `@webiny/api-core/features/buildParams/index.js` |

### webiny/api/logger
| Abstraction | Source |
| --- | --- |
| `Logger` | `@webiny/api-core/features/logger/index.js` |

### webiny/api/key-value-store
| Abstraction | Source |
| --- | --- |
| `GlobalKeyValueStore` | `@webiny/api-core/features/keyValueStore/index.js` |
| `KeyValueStore` | `@webiny/api-core/features/keyValueStore/index.js` |

### webiny/api/event-publisher
| Abstraction | Source |
| --- | --- |
| `EventPublisher` | `@webiny/api-core/features/eventPublisher/index.js` |

### webiny/api/graphql
| Abstraction | Source |
| --- | --- |
| `GraphQLSchemaFactory` | `@webiny/handler-graphql/graphql/abstractions.js` |

### webiny/api/tasks
| Abstraction | Source |
| --- | --- |
| `TaskService` | `@webiny/api-core/features/task/TaskService/index.js` |
| `TaskDefinition` | `@webiny/api-core/features/task/TaskDefinition/index.js` |

### webiny/api/system
| Abstraction | Source |
| --- | --- |
| `InstallSystemUseCase` | `@webiny/api-core/features/system/InstallSystem/index.js` |
| `SystemInstalledEventHandler` | `@webiny/api-core/features/system/InstallSystem/index.js` |

### webiny/api/security
| Abstraction | Source |
| --- | --- |
| `IdentityContext` | `@webiny/api-core/features/security/IdentityContext/index.js` |
| `ApiKeyFactory` | `@webiny/api-core/features/security/apiKeys/shared/abstractions.js` |
| `IdentityProvider` | `@webiny/api-core/idp/index.js` |
| `OidcIdentityProvider` | `@webiny/api-core/idp/index.js` |
| `JwtIdentityProvider` | `@webiny/api-core/idp/index.js` |
| `Authenticator` | `@webiny/api-core/features/security/authentication/Authenticator/abstractions.js` |
| `Authorizer` | `@webiny/api-core/features/security/authorization/Authorizer/index.js` |

### webiny/api/security/authentication
| Abstraction | Source |
| --- | --- |
| `BeforeAuthenticationEventHandler` | `@webiny/api-core/features/security/authentication/AuthenticationContext/index.js` |
| `AfterAuthenticationEventHandler` | `@webiny/api-core/features/security/authentication/AuthenticationContext/index.js` |

### webiny/api/security/api-key
| Abstraction | Source |
| --- | --- |
| `CreateApiKeyUseCase` | `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.js` |
| `DeleteApiKeyUseCase` | `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.js` |
| `GetApiKeyUseCase` | `@webiny/api-core/features/security/apiKeys/GetApiKey/index.js` |
| `GetApiKeyByTokenUseCase` | `@webiny/api-core/features/security/apiKeys/GetApiKeyByToken/index.js` |
| `ListApiKeysUseCase` | `@webiny/api-core/features/security/apiKeys/ListApiKeys/index.js` |
| `UpdateApiKeyUseCase` | `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.js` |
| `ApiKeyFactory` | `@webiny/api-core/features/security/apiKeys/shared/abstractions.js` |
| `ApiKeyBeforeCreateEventHandler` | `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.js` |
| `ApiKeyAfterCreateEventHandler` | `@webiny/api-core/features/security/apiKeys/CreateApiKey/index.js` |
| `ApiKeyBeforeDeleteEventHandler` | `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.js` |
| `ApiKeyAfterDeleteEventHandler` | `@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.js` |
| `ApiKeyBeforeUpdateEventHandler` | `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.js` |
| `ApiKeyAfterUpdateEventHandler` | `@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.js` |

### webiny/api/security/role
| Abstraction | Source |
| --- | --- |
| `CreateRoleUseCase` | `@webiny/api-core/features/security/roles/CreateRole/index.js` |
| `DeleteRoleUseCase` | `@webiny/api-core/features/security/roles/DeleteRole/index.js` |
| `GetRoleUseCase` | `@webiny/api-core/features/security/roles/GetRole/index.js` |
| `ListRolesUseCase` | `@webiny/api-core/features/security/roles/ListRoles/index.js` |
| `UpdateRoleUseCase` | `@webiny/api-core/features/security/roles/UpdateRole/index.js` |
| `RoleBeforeCreateEventHandler` | `@webiny/api-core/features/security/roles/CreateRole/index.js` |
| `RoleAfterCreateEventHandler` | `@webiny/api-core/features/security/roles/CreateRole/index.js` |
| `RoleBeforeDeleteEventHandler` | `@webiny/api-core/features/security/roles/DeleteRole/index.js` |
| `RoleAfterDeleteEventHandler` | `@webiny/api-core/features/security/roles/DeleteRole/index.js` |
| `RoleBeforeUpdateEventHandler` | `@webiny/api-core/features/security/roles/UpdateRole/index.js` |
| `RoleAfterUpdateEventHandler` | `@webiny/api-core/features/security/roles/UpdateRole/index.js` |

### webiny/api/security/user
| Abstraction | Source |
| --- | --- |
| `CreateUserUseCase` | `@webiny/api-core/features/users/CreateUser/index.js` |
| `DeleteUserUseCase` | `@webiny/api-core/features/users/DeleteUser/index.js` |
| `UpdateUserUseCase` | `@webiny/api-core/features/users/UpdateUser/index.js` |
| `GetUserUseCase` | `@webiny/api-core/features/users/GetUser/index.js` |
| `ListUsersUseCase` | `@webiny/api-core/features/users/ListUsers/index.js` |
| `ListUserTeamsUseCase` | `@webiny/api-core/features/users/ListUserTeams/index.js` |
| `UserBeforeCreateEventHandler` | `@webiny/api-core/features/users/CreateUser/index.js` |
| `UserAfterCreateEventHandler` | `@webiny/api-core/features/users/CreateUser/index.js` |
| `UserBeforeDeleteEventHandler` | `@webiny/api-core/features/users/DeleteUser/index.js` |
| `UserAfterDeleteEventHandler` | `@webiny/api-core/features/users/DeleteUser/index.js` |
| `UserBeforeUpdateEventHandler` | `@webiny/api-core/features/users/UpdateUser/index.js` |
| `UserAfterUpdateEventHandler` | `@webiny/api-core/features/users/UpdateUser/index.js` |

### webiny/api/tenancy
| Abstraction | Source |
| --- | --- |
| `TenantContext` | `@webiny/api-core/features/tenancy/TenantContext/index.js` |
| `CreateTenantUseCase` | `@webiny/api-core/features/tenancy/CreateTenant/index.js` |
| `CreateTenantRepository` | `@webiny/api-core/features/tenancy/CreateTenant/index.js` |
| `GetTenantByIdUseCase` | `@webiny/api-core/features/tenancy/GetTenantById/index.js` |
| `UpdateTenantUseCase` | `@webiny/api-core/features/tenancy/UpdateTenant/index.js` |
| `UpdateTenantRepository` | `@webiny/api-core/features/tenancy/UpdateTenant/index.js` |
| `DeleteTenantUseCase` | `@webiny/api-core/features/tenancy/DeleteTenant/index.js` |
| `DeleteTenantRepository` | `@webiny/api-core/features/tenancy/DeleteTenant/index.js` |
| `InstallTenantUseCase` | `@webiny/api-core/features/tenancy/InstallTenant/index.js` |
| `AppInstaller` | `@webiny/api-core/features/tenancy/InstallTenant/index.js` |
| `TenantBeforeCreateEventHandler` | `@webiny/api-core/features/tenancy/CreateTenant/index.js` |
| `TenantAfterCreateEventHandler` | `@webiny/api-core/features/tenancy/CreateTenant/index.js` |
| `TenantBeforeUpdateEventHandler` | `@webiny/api-core/features/tenancy/UpdateTenant/index.js` |
| `TenantAfterUpdateEventHandler` | `@webiny/api-core/features/tenancy/UpdateTenant/index.js` |
| `TenantBeforeDeleteEventHandler` | `@webiny/api-core/features/tenancy/DeleteTenant/index.js` |
| `TenantAfterDeleteEventHandler` | `@webiny/api-core/features/tenancy/DeleteTenant/index.js` |
| `TenantInstalledEventHandler` | `@webiny/api-core/features/tenancy/InstallTenant/index.js` |

### webiny/api/tenant-manager
| Abstraction | Source |
| --- | --- |
| `TenantModelExtension` | `@webiny/tenant-manager/api/domain/TenantModelExtension.js` |

### webiny/api/cms/entry
| Abstraction | Source |
| --- | --- |
| `CreateEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.js` |
| `CreateEntryRevisionFromUseCase` | `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/abstractions.js` |
| `DeleteEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.js` |
| `MoveEntryToBinUseCase` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.js` |
| `DeleteEntryRevisionUseCase` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/abstractions.js` |
| `DeleteMultipleEntriesUseCase` | `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/abstractions.js` |
| `MoveEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/MoveEntry/abstractions.js` |
| `PublishEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/PublishEntry/abstractions.js` |
| `RepublishEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/abstractions.js` |
| `RestoreEntryFromBinUseCase` | `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/abstractions.js` |
| `UnpublishEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/abstractions.js` |
| `UpdateEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/abstractions.js` |
| `UpdateSingletonEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/UpdateSingletonEntry/abstractions.js` |
| `GetEntriesByIdsUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetEntriesByIds/abstractions.js` |
| `GetEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetEntry/abstractions.js` |
| `GetEntryByIdUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetEntryById/abstractions.js` |
| `GetLatestEntriesByIdsUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/abstractions.js` |
| `GetLatestRevisionByEntryIdBaseUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.js` |
| `GetLatestRevisionByEntryIdUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.js` |
| `GetLatestDeletedRevisionByEntryIdUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.js` |
| `GetLatestRevisionByEntryIdIncludingDeletedUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.js` |
| `GetPreviousRevisionByEntryIdBaseUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetPreviousRevisionByEntryId/abstractions.js` |
| `GetPreviousRevisionByEntryIdUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetPreviousRevisionByEntryId/abstractions.js` |
| `GetPublishedEntriesByIdsUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetPublishedEntriesByIds/abstractions.js` |
| `GetPublishedRevisionByEntryIdUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetPublishedRevisionByEntryId/abstractions.js` |
| `GetRevisionByIdUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js` |
| `GetRevisionsByEntryIdUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetRevisionsByEntryId/abstractions.js` |
| `GetSingletonEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/GetSingletonEntry/abstractions.js` |
| `ListEntriesUseCase` | `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js` |
| `ListLatestEntriesUseCase` | `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js` |
| `ListPublishedEntriesUseCase` | `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js` |
| `ListDeletedEntriesUseCase` | `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js` |
| `ValidateEntryUseCase` | `@webiny/api-headless-cms/features/contentEntry/ValidateEntry/abstractions.js` |
| `CmsWhereMapper` | `@webiny/api-headless-cms/features/whereMapper/abstractions.js` |
| `CmsSortMapper` | `@webiny/api-headless-cms/features/sortMapper/abstractions.js` |
| `EntryBeforeCreateEventHandler` | `@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.js` |
| `EntryAfterCreateEventHandler` | `@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.js` |
| `EntryRevisionBeforeCreateEventHandler` | `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.js` |
| `EntryRevisionAfterCreateEventHandler` | `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.js` |
| `EntryBeforeDeleteEventHandler` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js` |
| `EntryAfterDeleteEventHandler` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js` |
| `EntryRevisionBeforeDeleteEventHandler` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.js` |
| `EntryRevisionAfterDeleteEventHandler` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.js` |
| `EntryBeforeDeleteMultipleEventHandler` | `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/events.js` |
| `EntryAfterDeleteMultipleEventHandler` | `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/events.js` |
| `EntryBeforeMoveEventHandler` | `@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.js` |
| `EntryAfterMoveEventHandler` | `@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.js` |
| `EntryBeforePublishEventHandler` | `@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.js` |
| `EntryAfterPublishEventHandler` | `@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.js` |
| `EntryBeforeRepublishEventHandler` | `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.js` |
| `EntryAfterRepublishEventHandler` | `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.js` |
| `EntryBeforeRestoreFromBinEventHandler` | `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js` |
| `EntryAfterRestoreFromBinEventHandler` | `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js` |
| `EntryBeforeUnpublishEventHandler` | `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.js` |
| `EntryAfterUnpublishEventHandler` | `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.js` |
| `EntryBeforeUpdateEventHandler` | `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js` |
| `EntryAfterUpdateEventHandler` | `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js` |

### webiny/api/cms/model
| Abstraction | Source |
| --- | --- |
| `ModelFactory` | `@webiny/api-headless-cms/features/modelBuilder/abstractions.js` |
| `FieldType` | `@webiny/api-headless-cms/features/modelBuilder/fields/abstractions.js` |
| `CreateModelUseCase` | `@webiny/api-headless-cms/features/contentModel/CreateModel/abstractions.js` |
| `CreateModelFromUseCase` | `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/abstractions.js` |
| `UpdateModelUseCase` | `@webiny/api-headless-cms/features/contentModel/UpdateModel/abstractions.js` |
| `DeleteModelUseCase` | `@webiny/api-headless-cms/features/contentModel/DeleteModel/abstractions.js` |
| `GetModelUseCase` | `@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js` |
| `ListModelsUseCase` | `@webiny/api-headless-cms/features/contentModel/ListModels/abstractions.js` |
| `ModelBeforeCreateEventHandler` | `@webiny/api-headless-cms/features/contentModel/CreateModel/events.js` |
| `ModelAfterCreateEventHandler` | `@webiny/api-headless-cms/features/contentModel/CreateModel/events.js` |
| `ModelBeforeCreateFromEventHandler` | `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js` |
| `ModelAfterCreateFromEventHandler` | `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js` |
| `ModelBeforeUpdateEventHandler` | `@webiny/api-headless-cms/features/contentModel/UpdateModel/events.js` |
| `ModelAfterUpdateEventHandler` | `@webiny/api-headless-cms/features/contentModel/UpdateModel/events.js` |
| `ModelBeforeDeleteEventHandler` | `@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js` |
| `ModelAfterDeleteEventHandler` | `@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js` |

### webiny/api/cms/group
| Abstraction | Source |
| --- | --- |
| `ModelGroupFactory` | `@webiny/api-headless-cms/features/contentModelGroup/shared/abstractions.js` |
| `CreateGroupUseCase` | `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/abstractions.js` |
| `UpdateGroupUseCase` | `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/abstractions.js` |
| `DeleteGroupUseCase` | `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/abstractions.js` |
| `ListGroupsUseCase` | `@webiny/api-headless-cms/features/contentModelGroup/ListGroups/abstractions.js` |
| `GetGroupUseCase` | `@webiny/api-headless-cms/features/contentModelGroup/GetGroup/abstractions.js` |
| `GroupBeforeCreateEventHandler` | `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/events.js` |
| `GroupAfterCreateEventHandler` | `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/events.js` |
| `GroupBeforeUpdateEventHandler` | `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/events.js` |
| `GroupAfterUpdateEventHandler` | `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/events.js` |
| `GroupBeforeDeleteEventHandler` | `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.js` |
| `GroupAfterDeleteEventHandler` | `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.js` |

### webiny/api/website-builder/nextjs
| Abstraction | Source |
| --- | --- |
| `NextjsConfig` | `@webiny/api-website-builder/features/nextjs/abstractions.js` |

### webiny/api/website-builder/page
| Abstraction | Source |
| --- | --- |
| `CreatePageUseCase` | `@webiny/api-website-builder/features/pages/CreatePage/abstractions.js` |
| `CreatePageRevisionFromUseCase` | `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.js` |
| `DeletePageUseCase` | `@webiny/api-website-builder/features/pages/DeletePage/abstractions.js` |
| `DuplicatePageUseCase` | `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.js` |
| `GetPageByIdUseCase` | `@webiny/api-website-builder/features/pages/GetPageById/abstractions.js` |
| `GetPageByPathUseCase` | `@webiny/api-website-builder/features/pages/GetPageByPath/abstractions.js` |
| `GetPageRevisionsUseCase` | `@webiny/api-website-builder/features/pages/GetPageRevisions/abstractions.js` |
| `ListPagesUseCase` | `@webiny/api-website-builder/features/pages/ListPages/abstractions.js` |
| `MovePageUseCase` | `@webiny/api-website-builder/features/pages/MovePage/abstractions.js` |
| `PublishPageUseCase` | `@webiny/api-website-builder/features/pages/PublishPage/abstractions.js` |
| `UnpublishPageUseCase` | `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.js` |
| `UpdatePageUseCase` | `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.js` |
| `PageBeforeCreateEventHandler` | `@webiny/api-website-builder/features/pages/CreatePage/abstractions.js` |
| `PageAfterCreateEventHandler` | `@webiny/api-website-builder/features/pages/CreatePage/abstractions.js` |
| `PageBeforeCreateRevisionFromEventHandler` | `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.js` |
| `PageAfterCreateRevisionFromEventHandler` | `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.js` |
| `PageBeforeDeleteEventHandler` | `@webiny/api-website-builder/features/pages/DeletePage/abstractions.js` |
| `PageAfterDeleteEventHandler` | `@webiny/api-website-builder/features/pages/DeletePage/abstractions.js` |
| `PageBeforeDuplicateEventHandler` | `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.js` |
| `PageAfterDuplicateEventHandler` | `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.js` |
| `PageBeforeMoveEventHandler` | `@webiny/api-website-builder/features/pages/MovePage/abstractions.js` |
| `PageAfterMoveEventHandler` | `@webiny/api-website-builder/features/pages/MovePage/abstractions.js` |
| `PageBeforePublishEventHandler` | `@webiny/api-website-builder/features/pages/PublishPage/abstractions.js` |
| `PageAfterPublishEventHandler` | `@webiny/api-website-builder/features/pages/PublishPage/abstractions.js` |
| `PageBeforeUnpublishEventHandler` | `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.js` |
| `PageAfterUnpublishEventHandler` | `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.js` |
| `PageBeforeUpdateEventHandler` | `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.js` |
| `PageAfterUpdateEventHandler` | `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.js` |

### webiny/api/website-builder/redirect
| Abstraction | Source |
| --- | --- |
| `CreateRedirectUseCase` | `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.js` |
| `DeleteRedirectUseCase` | `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.js` |
| `GetActiveRedirectsUseCase` | `@webiny/api-website-builder/features/redirects/GetActiveRedirects/abstractions.js` |
| `GetRedirectByIdUseCase` | `@webiny/api-website-builder/features/redirects/GetRedirectById/abstractions.js` |
| `InvalidateRedirectsCacheUseCase` | `@webiny/api-website-builder/features/redirects/InvalidateRedirectsCache/abstractions.js` |
| `ListRedirectsUseCase` | `@webiny/api-website-builder/features/redirects/ListRedirects/abstractions.js` |
| `MoveRedirectUseCase` | `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.js` |
| `UpdateRedirectUseCase` | `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.js` |
| `RedirectBeforeCreateEventHandler` | `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.js` |
| `RedirectAfterCreateEventHandler` | `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.js` |
| `RedirectBeforeDeleteEventHandler` | `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.js` |
| `RedirectAfterDeleteEventHandler` | `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.js` |
| `RedirectBeforeMoveEventHandler` | `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.js` |
| `RedirectAfterMoveEventHandler` | `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.js` |
| `RedirectBeforeUpdateEventHandler` | `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.js` |
| `RedirectAfterUpdateEventHandler` | `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.js` |

## Notes

- The `webiny` package files are at `packages/webiny/src/api/**/*.ts`
- Each file is a pure re-export barrel — no logic, just `export { X } from "..."` statements
- Event handlers follow the pattern `*Before*EventHandler` / `*After*EventHandler`
- Use cases follow the pattern `*UseCase`
- Repositories follow the pattern `*Repository`
- Factories follow the pattern `*Factory`
- `ApiKeyFactory` appears in both `webiny/api/security` and `webiny/api/security/api-key` (same abstraction, dual export)
