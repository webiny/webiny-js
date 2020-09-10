import models from "../models";

export default () => [
    models(),
    {
        type: "permissions-manager-middleware",
        async getPermissions({ identity, type }, context) {
            if (identity) {
                const { SecurityUser } = context.models;
                const user = await SecurityUser.findOne({ query: { id: identity } });
                if (!user) {
                    throw Error(`User "${identity}" was not found!`);
                }

                return user.permissions;
            }

            // Identity is "anonymous", and we need to load the "anonymous" role.
            return [];
            // const { SecurityRole } = context.models;
            // const role = await SecurityRole.findOne({ query: { slug: "anonymous" } });
            // if (!role) {
            //     return [];
            // }
            //
            // return role.permissions;
        }
    }
];
