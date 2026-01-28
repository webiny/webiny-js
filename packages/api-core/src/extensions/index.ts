// Event handlers.
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
} from "./eventHandlers/index.js";

// Generic extension that supports any API abstraction.
import { GenericExtension } from "./GenericExtension.js";
import { BuildParam } from "./BuildParam.js";

// Exports.
export { GenericExtension };
export { BuildParam };
export { ApiKeyBeforeCreate };
export { ApiKeyAfterCreate };
export { ApiKeyBeforeUpdate };
export { ApiKeyAfterUpdate };
export { ApiKeyBeforeDelete };
export { ApiKeyAfterDelete };

export { RoleBeforeCreate };
export { RoleAfterCreate };
export { RoleBeforeUpdate };
export { RoleAfterUpdate };
export { RoleBeforeDelete };
export { RoleAfterDelete };

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

// Definitions (used internally). 👇
export const definitions = [
    GenericExtension.def,
    BuildParam.def,
    ApiKeyBeforeCreate.def,
    ApiKeyAfterCreate.def,
    ApiKeyBeforeUpdate.def,
    ApiKeyAfterUpdate.def,
    ApiKeyBeforeDelete.def,
    ApiKeyAfterDelete.def,
    RoleBeforeCreate.def,
    RoleAfterCreate.def,
    RoleBeforeUpdate.def,
    RoleAfterUpdate.def,
    RoleBeforeDelete.def,
    RoleAfterDelete.def,
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
    SystemInstalled.def
];
