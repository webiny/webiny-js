// @flow
import setupEntities from "./setupEntities";
import * as data from "./data";

export default async (context: Object) => {
    setupEntities(context);
    const { User, Role, Group } = context.security.entities;

    const user = new User();

    const superAdminRole = new Role();
    await superAdminRole.populate(data.superAdminRole).save();

    await user.populate({ ...data.superAdminUser, roles: [superAdminRole] }).save();

    context.user = user;

    const group = new Group();
    await group.populate({ ...data.fullAccessGroup, roles: data.roles }).save();
};
