// @flow
import setupEntities from "../dataSource/setupEntities";

export default async (context: Object) => {
    const { User, Role } = setupEntities(context);
    const user = new User();

    const superAdminRole = new Role();
    superAdminRole.populate({
        name: "Super Admin",
        slug: "super-admin",
        description:
            "This role gives super admin privileges. Be careful when assigning this role to users!",
        scopes: ["superadmin"]
    });

    await superAdminRole.save();

    user.populate({
        firstName: "John",
        lastName: "Doe",
        password: "12345678",
        email: "admin@webiny.com",
        roles: [superAdminRole]
    });

    await user.save();
    context.user = user;
};
