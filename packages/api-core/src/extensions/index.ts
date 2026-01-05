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
    GenericExtension.def,
    ApiKeyBeforeCreate.def,
    ApiKeyAfterCreate.def,
    ApiKeyBeforeUpdate.def,
    ApiKeyAfterUpdate.def,
    ApiKeyBeforeDelete.def,
    ApiKeyAfterDelete.def,
    GroupBeforeCreate.def,
    GroupAfterCreate.def,
    GroupBeforeUpdate.def,
    GroupAfterUpdate.def,
    GroupBeforeDelete.def,
    GroupAfterDelete.def,
    TeamBeforeCreate.def,
    TeamAfterCreate.def,
    TeamBeforeUpdate.def,
    TeamAfterUpdate.def,
    TeamBeforeDelete.def,
    TeamAfterDelete.def,
    BeforeAuthentication.def,
    AfterAuthentication.def,
    UserBeforeCreate.def,
    UserAfterCreate.def,
    UserBeforeUpdate.def,
    UserAfterUpdate.def,
    UserBeforeDelete.def,
    UserAfterDelete.def,
    TenantBeforeCreate.def,
    TenantAfterCreate.def,
    TenantBeforeUpdate.def,
    TenantAfterUpdate.def,
    TenantBeforeDelete.def,
    TenantAfterDelete.def,
    TenantInstalled.def,
    SystemInstalled.def,
    SettingsBeforeUpdate.def,
    SettingsAfterUpdate.def,
    SettingsBeforeDelete.def,
    SettingsAfterDelete.def
];
