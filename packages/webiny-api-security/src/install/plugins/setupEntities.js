// @flow
import { userFactory } from "./../../models/SecurityUser.model";
import { groupFactory } from "./../../models/SecurityGroup.model";
import { groups2modelsFactory } from "./../../models/SecurityGroups2Entities.model";
import { roleFactory } from "./../../models/SecurityRole.model";
import { roles2modelsFactory } from "./../../models/SecurityRoles2Entities.model";

export default (context: Object) => {
    context.security = { ...context.security, models: {} };
    context.security.models.User = userFactory(context);
    context.security.models.Group = groupFactory(context);
    context.security.models.Role = roleFactory(context);
    context.security.models.Groups2Models = groups2modelsFactory(context);
    context.security.models.Roles2Models = roles2modelsFactory(context);
};
