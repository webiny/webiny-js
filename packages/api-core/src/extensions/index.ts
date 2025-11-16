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
    AfterAuthentication as AfterAuthenticationExt
} from "./eventHandlers/index.js";

// Exports.
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

// Definitions (used internally). 👇
export const definitions = [
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
    AfterAuthenticationExt.definition
];
