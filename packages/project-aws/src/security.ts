import {
    ApiKeyBeforeCreate,
    ApiKeyAfterCreate,
    ApiKeyBeforeUpdate,
    ApiKeyAfterUpdate,
    ApiKeyBeforeDelete,
    ApiKeyAfterDelete,
    RoleBeforeCreate,
    RoleAfterCreate,
    RoleBeforeUpdate,
    RoleAfterUpdate,
    RoleBeforeDelete,
    RoleAfterDelete,
    TeamBeforeCreate,
    TeamAfterCreate,
    TeamBeforeUpdate,
    TeamAfterUpdate,
    TeamBeforeDelete,
    TeamAfterDelete,
    BeforeAuthentication,
    AfterAuthentication,
    UserBeforeCreate,
    UserAfterCreate,
    UserBeforeUpdate,
    UserAfterUpdate,
    UserBeforeDelete,
    UserAfterDelete,
    TenantBeforeCreate,
    TenantAfterCreate,
    TenantBeforeUpdate,
    TenantAfterUpdate,
    TenantBeforeDelete,
    TenantAfterDelete,
    TenantInstalled,
    SystemInstalled
} from "@webiny/api-core/extensions/eventHandlers/index.js";

export const Security = {
    ApiKey: {
        BeforeCreate: ApiKeyBeforeCreate,
        AfterCreate: ApiKeyAfterCreate,
        BeforeUpdate: ApiKeyBeforeUpdate,
        AfterUpdate: ApiKeyAfterUpdate,
        BeforeDelete: ApiKeyBeforeDelete,
        AfterDelete: ApiKeyAfterDelete
    },
    Role: {
        BeforeCreate: RoleBeforeCreate,
        AfterCreate: RoleAfterCreate,
        BeforeUpdate: RoleBeforeUpdate,
        AfterUpdate: RoleAfterUpdate,
        BeforeDelete: RoleBeforeDelete,
        AfterDelete: RoleAfterDelete
    },
    Team: {
        BeforeCreate: TeamBeforeCreate,
        AfterCreate: TeamAfterCreate,
        BeforeUpdate: TeamBeforeUpdate,
        AfterUpdate: TeamAfterUpdate,
        BeforeDelete: TeamBeforeDelete,
        AfterDelete: TeamAfterDelete
    },
    Authentication: {
        Before: BeforeAuthentication,
        After: AfterAuthentication
    },
    User: {
        BeforeCreate: UserBeforeCreate,
        AfterCreate: UserAfterCreate,
        BeforeUpdate: UserBeforeUpdate,
        AfterUpdate: UserAfterUpdate,
        BeforeDelete: UserBeforeDelete,
        AfterDelete: UserAfterDelete
    },
    Tenant: {
        BeforeCreate: TenantBeforeCreate,
        AfterCreate: TenantAfterCreate,
        BeforeUpdate: TenantBeforeUpdate,
        AfterUpdate: TenantAfterUpdate,
        BeforeDelete: TenantBeforeDelete,
        AfterDelete: TenantAfterDelete,
        Installed: TenantInstalled
    },
    System: {
        Installed: SystemInstalled
    }
};
