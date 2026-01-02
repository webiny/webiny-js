// Event handlers.
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
} from "./eventHandlers/index.js";

// Generic extension that supports any API abstraction.
import { GenericExtension } from "./GenericExtension.js";

// Exports.
export { GenericExtension };
export { ApiKeyBeforeCreate };
export { ApiKeyAfterCreate };
export { ApiKeyBeforeUpdate };
export { ApiKeyAfterUpdate };
export { ApiKeyBeforeDelete };
export { ApiKeyAfterDelete };

export { GroupBeforeCreate };
export { GroupAfterCreate };
export { GroupBeforeUpdate };
export { GroupAfterUpdate };
export { GroupBeforeDelete };
export { GroupAfterDelete };

export { TeamBeforeCreate };
export { TeamAfterCreate };
export { TeamBeforeUpdate };
export { TeamAfterUpdate };
export { TeamBeforeDelete };
export { TeamAfterDelete };

export { BeforeAuthentication };
export { AfterAuthentication };

export { UserBeforeCreate };
export { UserAfterCreate };
export { UserBeforeUpdate };
export { UserAfterUpdate };
export { UserBeforeDelete };
export { UserAfterDelete };

export { TenantBeforeCreate };
export { TenantAfterCreate };
export { TenantBeforeUpdate };
export { TenantAfterUpdate };
export { TenantBeforeDelete };
export { TenantAfterDelete };
export { TenantInstalled };

export { SystemInstalled };

export { SettingsBeforeUpdate };
export { SettingsAfterUpdate };
export { SettingsBeforeDelete };
export { SettingsAfterDelete };

// Definitions (used internally). 👇
export const definitions = [
    GenericExtension.definition,
    ApiKeyBeforeCreate.definition,
    ApiKeyAfterCreate.definition,
    ApiKeyBeforeUpdate.definition,
    ApiKeyAfterUpdate.definition,
    ApiKeyBeforeDelete.definition,
    ApiKeyAfterDelete.definition,
    GroupBeforeCreate.definition,
    GroupAfterCreate.definition,
    GroupBeforeUpdate.definition,
    GroupAfterUpdate.definition,
    GroupBeforeDelete.definition,
    GroupAfterDelete.definition,
    TeamBeforeCreate.definition,
    TeamAfterCreate.definition,
    TeamBeforeUpdate.definition,
    TeamAfterUpdate.definition,
    TeamBeforeDelete.definition,
    TeamAfterDelete.definition,
    BeforeAuthentication.definition,
    AfterAuthentication.definition,
    UserBeforeCreate.definition,
    UserAfterCreate.definition,
    UserBeforeUpdate.definition,
    UserAfterUpdate.definition,
    UserBeforeDelete.definition,
    UserAfterDelete.definition,
    TenantBeforeCreate.definition,
    TenantAfterCreate.definition,
    TenantBeforeUpdate.definition,
    TenantAfterUpdate.definition,
    TenantBeforeDelete.definition,
    TenantAfterDelete.definition,
    TenantInstalled.definition,
    SystemInstalled.definition,
    SettingsBeforeUpdate.definition,
    SettingsAfterUpdate.definition,
    SettingsBeforeDelete.definition,
    SettingsAfterDelete.definition
];
