// @flow
import { userFactory } from "./../entities/User.entity";
import { apiTokenFactory } from "./../entities/ApiToken.entity";
import { groupFactory } from "./../entities/Group.entity";
import { groups2entitiesFactory } from "./../entities/Groups2Entities.entity";
import { roleFactory } from "./../entities/Role.entity";
import { roles2entitiesFactory } from "./../entities/Roles2Entities.entity";
import { userSettingsFactory } from "./../entities/UserSettings.entity";

export default context => {
    context.api = { entities: {} };
    context.api.entities.User = userFactory(context);
    context.api.entities.ApiToken = apiTokenFactory(context);
    context.api.entities.Group = groupFactory(context);
    context.api.entities.Role = roleFactory(context);
    context.api.entities.Groups2Entities = groups2entitiesFactory(context);
    context.api.entities.Roles2Entities = roles2entitiesFactory(context);
    context.api.entities.UserSettings = userSettingsFactory(context);
};
