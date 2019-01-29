// @flow
import { userFactory } from "./../../entities/User.entity";
import { groupFactory } from "./../../entities/Group.entity";
import { groups2entitiesFactory } from "./../../entities/Groups2Entities.entity";
import { roleFactory } from "./../../entities/Role.entity";
import { roles2entitiesFactory } from "./../../entities/Roles2Entities.entity";
import { userSettingsFactory } from "./../../entities/UserSettings.entity";

export default (context: Object) => {
    context.security = { ...context.security, entities: {} };
    context.security.entities.User = userFactory(context);
    context.security.entities.Group = groupFactory(context);
    context.security.entities.Role = roleFactory(context);
    context.security.entities.Groups2Entities = groups2entitiesFactory(context);
    context.security.entities.Roles2Entities = roles2entitiesFactory(context);
    context.security.entities.UserSettings = userSettingsFactory(context);
};
