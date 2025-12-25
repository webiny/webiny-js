// Event handlers.
import {
    ApiKeyBeforeCreate as ApiKeyBeforeCreateExt,
    ApiKeyAfterCreate as ApiKeyAfterCreateExt,
    ApiKeyBeforeUpdate as ApiKeyBeforeUpdateExt,
    ApiKeyAfterUpdate as ApiKeyAfterUpdateExt,
    ApiKeyBeforeDelete as ApiKeyBeforeDeleteExt,
    ApiKeyAfterDelete as ApiKeyAfterDeleteExt,
    GroupBeforeCreate as GroupBeforeCreateExt,
    GroupAfterCreate as GroupAfterCreateExt,
    GroupBeforeUpdate as GroupBeforeUpdateExt,
    GroupAfterUpdate as GroupAfterUpdateExt,
    GroupBeforeDelete as GroupBeforeDeleteExt,
    GroupAfterDelete as GroupAfterDeleteExt,
    TeamBeforeCreate as TeamBeforeCreateExt,
    TeamAfterCreate as TeamAfterCreateExt,
    TeamBeforeUpdate as TeamBeforeUpdateExt,
    TeamAfterUpdate as TeamAfterUpdateExt,
    TeamBeforeDelete as TeamBeforeDeleteExt,
    TeamAfterDelete as TeamAfterDeleteExt,
    BeforeAuthentication as BeforeAuthenticationExt,
    AfterAuthentication as AfterAuthenticationExt,
    UserBeforeCreate as UserBeforeCreateExt,
    UserAfterCreate as UserAfterCreateExt,
    UserBeforeUpdate as UserBeforeUpdateExt,
    UserAfterUpdate as UserAfterUpdateExt,
    UserBeforeDelete as UserBeforeDeleteExt,
    UserAfterDelete as UserAfterDeleteExt,
    TenantBeforeCreate as TenantBeforeCreateExt,
    TenantAfterCreate as TenantAfterCreateExt,
    TenantBeforeUpdate as TenantBeforeUpdateExt,
    TenantAfterUpdate as TenantAfterUpdateExt,
    TenantBeforeDelete as TenantBeforeDeleteExt,
    TenantAfterDelete as TenantAfterDeleteExt,
    TenantInstalled as TenantInstalledExt,
    SystemInstalled as SystemInstalledExt,
    SettingsBeforeUpdate as SettingsBeforeUpdateExt,
    SettingsAfterUpdate as SettingsAfterUpdateExt,
    SettingsBeforeDelete as SettingsBeforeDeleteExt,
    SettingsAfterDelete as SettingsAfterDeleteExt
} from "./eventHandlers/index.js";

// Generic extension that supports any API abstraction.
import { GenericExtension as AnyExtension } from "./GenericExtension.js";

// Exports.
export const GenericExtension = AnyExtension.ReactComponent;
export const ApiKeyBeforeCreate = ApiKeyBeforeCreateExt.ReactComponent;
export const ApiKeyAfterCreate = ApiKeyAfterCreateExt.ReactComponent;
export const ApiKeyBeforeUpdate = ApiKeyBeforeUpdateExt.ReactComponent;
export const ApiKeyAfterUpdate = ApiKeyAfterUpdateExt.ReactComponent;
export const ApiKeyBeforeDelete = ApiKeyBeforeDeleteExt.ReactComponent;
export const ApiKeyAfterDelete = ApiKeyAfterDeleteExt.ReactComponent;

export const GroupBeforeCreate = GroupBeforeCreateExt.ReactComponent;
export const GroupAfterCreate = GroupAfterCreateExt.ReactComponent;
export const GroupBeforeUpdate = GroupBeforeUpdateExt.ReactComponent;
export const GroupAfterUpdate = GroupAfterUpdateExt.ReactComponent;
export const GroupBeforeDelete = GroupBeforeDeleteExt.ReactComponent;
export const GroupAfterDelete = GroupAfterDeleteExt.ReactComponent;

export const TeamBeforeCreate = TeamBeforeCreateExt.ReactComponent;
export const TeamAfterCreate = TeamAfterCreateExt.ReactComponent;
export const TeamBeforeUpdate = TeamBeforeUpdateExt.ReactComponent;
export const TeamAfterUpdate = TeamAfterUpdateExt.ReactComponent;
export const TeamBeforeDelete = TeamBeforeDeleteExt.ReactComponent;
export const TeamAfterDelete = TeamAfterDeleteExt.ReactComponent;

export const BeforeAuthentication = BeforeAuthenticationExt.ReactComponent;
export const AfterAuthentication = AfterAuthenticationExt.ReactComponent;

export const UserBeforeCreate = UserBeforeCreateExt.ReactComponent;
export const UserAfterCreate = UserAfterCreateExt.ReactComponent;
export const UserBeforeUpdate = UserBeforeUpdateExt.ReactComponent;
export const UserAfterUpdate = UserAfterUpdateExt.ReactComponent;
export const UserBeforeDelete = UserBeforeDeleteExt.ReactComponent;
export const UserAfterDelete = UserAfterDeleteExt.ReactComponent;

export const TenantBeforeCreate = TenantBeforeCreateExt.ReactComponent;
export const TenantAfterCreate = TenantAfterCreateExt.ReactComponent;
export const TenantBeforeUpdate = TenantBeforeUpdateExt.ReactComponent;
export const TenantAfterUpdate = TenantAfterUpdateExt.ReactComponent;
export const TenantBeforeDelete = TenantBeforeDeleteExt.ReactComponent;
export const TenantAfterDelete = TenantAfterDeleteExt.ReactComponent;
export const TenantInstalled = TenantInstalledExt.ReactComponent;

export const SystemInstalled = SystemInstalledExt.ReactComponent;

export const SettingsBeforeUpdate = SettingsBeforeUpdateExt.ReactComponent;
export const SettingsAfterUpdate = SettingsAfterUpdateExt.ReactComponent;
export const SettingsBeforeDelete = SettingsBeforeDeleteExt.ReactComponent;
export const SettingsAfterDelete = SettingsAfterDeleteExt.ReactComponent;

// Definitions (used internally). 👇
export const definitions = [
    AnyExtension.definition,
    ApiKeyBeforeCreateExt.definition,
    ApiKeyAfterCreateExt.definition,
    ApiKeyBeforeUpdateExt.definition,
    ApiKeyAfterUpdateExt.definition,
    ApiKeyBeforeDeleteExt.definition,
    ApiKeyAfterDeleteExt.definition,
    GroupBeforeCreateExt.definition,
    GroupAfterCreateExt.definition,
    GroupBeforeUpdateExt.definition,
    GroupAfterUpdateExt.definition,
    GroupBeforeDeleteExt.definition,
    GroupAfterDeleteExt.definition,
    TeamBeforeCreateExt.definition,
    TeamAfterCreateExt.definition,
    TeamBeforeUpdateExt.definition,
    TeamAfterUpdateExt.definition,
    TeamBeforeDeleteExt.definition,
    TeamAfterDeleteExt.definition,
    BeforeAuthenticationExt.definition,
    AfterAuthenticationExt.definition,
    UserBeforeCreateExt.definition,
    UserAfterCreateExt.definition,
    UserBeforeUpdateExt.definition,
    UserAfterUpdateExt.definition,
    UserBeforeDeleteExt.definition,
    UserAfterDeleteExt.definition,
    TenantBeforeCreateExt.definition,
    TenantAfterCreateExt.definition,
    TenantBeforeUpdateExt.definition,
    TenantAfterUpdateExt.definition,
    TenantBeforeDeleteExt.definition,
    TenantAfterDeleteExt.definition,
    TenantInstalledExt.definition,
    SystemInstalledExt.definition,
    SettingsBeforeUpdateExt.definition,
    SettingsAfterUpdateExt.definition,
    SettingsBeforeDeleteExt.definition,
    SettingsAfterDeleteExt.definition
];
