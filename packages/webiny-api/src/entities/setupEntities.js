// @flow
import { userFactory } from "./User.entity";
import { apiTokenFactory } from "./ApiToken.entity";
import { groupFactory } from "./Group.entity";
import { groups2entitiesFactory } from "./Groups2Entities.entity";
import { roleFactory } from "./Role.entity";
import { roles2entitiesFactory } from "./Roles2Entities.entity";
import { userSettingsFactory } from "./UserSettings.entity";

export default ({ user, config }: Object) => {
    let entities = {};

    entities.User = userFactory({ user, entities });
    entities.ApiToken = apiTokenFactory({ user, config, entities });
    entities.Group = groupFactory({ user, entities });
    entities.Role = roleFactory({ user, entities });
    entities.Groups2Entities = groups2entitiesFactory({ user, entities });
    entities.Roles2Entities = roles2entitiesFactory({ user, entities });
    entities.UserSettings = userSettingsFactory({ user, entities });

    return entities;
};
