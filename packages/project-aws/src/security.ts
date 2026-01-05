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
    SystemInstalled,
    SettingsBeforeUpdate,
    SettingsAfterUpdate,
    SettingsBeforeDelete,
    SettingsAfterDelete
} from "@webiny/api-core/extensions/index.js";

export const Security = {
    ApiKey: {
        BeforeCreate: ApiKeyBeforeCreate.ReactComponent,
        AfterCreate: ApiKeyAfterCreate.ReactComponent,
        BeforeUpdate: ApiKeyBeforeUpdate.ReactComponent,
        AfterUpdate: ApiKeyAfterUpdate.ReactComponent,
        BeforeDelete: ApiKeyBeforeDelete.ReactComponent,
        AfterDelete: ApiKeyAfterDelete.ReactComponent
    },
    Role: {
        BeforeCreate: RoleBeforeCreate.ReactComponent,
        AfterCreate: RoleAfterCreate.ReactComponent,
        BeforeUpdate: RoleBeforeUpdate.ReactComponent,
        AfterUpdate: RoleAfterUpdate.ReactComponent,
        BeforeDelete: RoleBeforeDelete.ReactComponent,
        AfterDelete: RoleAfterDelete.ReactComponent
    },
    Team: {
        BeforeCreate: TeamBeforeCreate.ReactComponent,
        AfterCreate: TeamAfterCreate.ReactComponent,
        BeforeUpdate: TeamBeforeUpdate.ReactComponent,
        AfterUpdate: TeamAfterUpdate.ReactComponent,
        BeforeDelete: TeamBeforeDelete.ReactComponent,
        AfterDelete: TeamAfterDelete.ReactComponent
    },
    Authentication: {
        Before: BeforeAuthentication.ReactComponent,
        After: AfterAuthentication.ReactComponent
    },
    User: {
        BeforeCreate: UserBeforeCreate.ReactComponent,
        AfterCreate: UserAfterCreate.ReactComponent,
        BeforeUpdate: UserBeforeUpdate.ReactComponent,
        AfterUpdate: UserAfterUpdate.ReactComponent,
        BeforeDelete: UserBeforeDelete.ReactComponent,
        AfterDelete: UserAfterDelete.ReactComponent
    },
    Tenant: {
        BeforeCreate: TenantBeforeCreate.ReactComponent,
        AfterCreate: TenantAfterCreate.ReactComponent,
        BeforeUpdate: TenantBeforeUpdate.ReactComponent,
        AfterUpdate: TenantAfterUpdate.ReactComponent,
        BeforeDelete: TenantBeforeDelete.ReactComponent,
        AfterDelete: TenantAfterDelete.ReactComponent,
        Installed: TenantInstalled.ReactComponent
    },
    System: {
        Installed: SystemInstalled.ReactComponent
    },
    Settings: {
        BeforeUpdate: SettingsBeforeUpdate.ReactComponent,
        AfterUpdate: SettingsAfterUpdate.ReactComponent,
        BeforeDelete: SettingsBeforeDelete.ReactComponent,
        AfterDelete: SettingsAfterDelete.ReactComponent
    }
};
