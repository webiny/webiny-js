import {
    ApiKeyBeforeCreate,
    ApiKeyAfterCreate,
    ApiKeyBeforeUpdate,
    ApiKeyAfterUpdate,
    ApiKeyBeforeDelete,
    ApiKeyAfterDelete,
    GroupBeforeCreate,
    GroupAfterCreate,
    GroupBeforeUpdate,
    GroupAfterUpdate,
    GroupBeforeDelete,
    GroupAfterDelete,
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
    SystemInstalled,
    SettingsBeforeUpdate,
    SettingsAfterUpdate,
    SettingsBeforeDelete,
    SettingsAfterDelete
} from "@webiny/api-core/extensions/index.js";

export const Security = {
    ApiKey: {
        BeforeCreate: ApiKeyBeforeCreate,
        AfterCreate: ApiKeyAfterCreate,
        BeforeUpdate: ApiKeyBeforeUpdate,
        AfterUpdate: ApiKeyAfterUpdate,
        BeforeDelete: ApiKeyBeforeDelete,
        AfterDelete: ApiKeyAfterDelete
    },
    Group: {
        BeforeCreate: GroupBeforeCreate,
        AfterCreate: GroupAfterCreate,
        BeforeUpdate: GroupBeforeUpdate,
        AfterUpdate: GroupAfterUpdate,
        BeforeDelete: GroupBeforeDelete,
        AfterDelete: GroupAfterDelete
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
    },
    Settings: {
        BeforeUpdate: SettingsBeforeUpdate,
        AfterUpdate: SettingsAfterUpdate,
        BeforeDelete: SettingsBeforeDelete,
        AfterDelete: SettingsAfterDelete
    }
};
