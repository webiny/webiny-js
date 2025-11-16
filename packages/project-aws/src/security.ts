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
    AfterAuthentication
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
    }
};
