import models from "../models";

export default () => [
    models(),
    {
        type: "permissions-manager-middleware",
        async getPermissions({ identity }, context) {
            if (identity) {
                const { SecurityUser } = context.models;
                const user = await SecurityUser.findOne({ query: { id: identity } });
                if (!user) {
                    throw Error(`User "${identity}" was not found!`);
                }

                return user.permissions;
            }

            // Identity is "anonymous", and we need to load permissions from the "anonymous" group.
            const { SecurityGroup } = context.models;
            const group = await SecurityGroup.findOne({ query: { slug: "anonymous" } });
            if (!group) {
                return [];
            }

            return group.permissions;
        }
    }
];
