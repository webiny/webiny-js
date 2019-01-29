// @flow
import get from "lodash/get";
import setupEntities from "./setupEntities";
import * as data from "./data";

export default async (context: Object) => {
    setupEntities(context);
    const { User, Role, Group } = context.security.entities;

    const user = new User();

    const fullAccess = new Role();
    await fullAccess.populate(data.fullAccessRole).save();

    const userData = get(context, "security.admin", data.superAdminUser);

    await user.populate({ ...userData, roles: [fullAccess] }).save();

    context.user = user;

    const group = new Group();
    await group.populate({ ...data.securityFullAccessGroup, roles: data.roles }).save();
};
