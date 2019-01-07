// @flow
import setupEntities from "./setupEntities";
import * as data from "./data";

export default async (context: Object) => {
    setupEntities(context);
    const { User, Role, Group } = context.security.entities;

    const user = new User();

    const fullAccess = new Role();
    await fullAccess.populate(data.fullAccessRole).save();

    await user.populate({ ...data.superAdminUser, roles: [fullAccess] }).save();

    context.user = user;

    const group = new Group();
    await group.populate({ ...data.securityFullAccessGroup, roles: data.roles }).save();
};
