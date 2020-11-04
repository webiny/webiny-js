export default () => [
    {
        type: "security-authorization",
        async getPermissions(context) {
            const { security, users, groups } = context;
            const identity = security.getIdentity();
            if (identity) {
                const user = await users.get(identity.id);

                if (!user) {
                    throw Error(`User "${identity.id}" was not found!`);
                }

                const group = await groups.get(user.group);
                return group?.permissions;
            }

            // Identity is "anonymous", and we need to load permissions from the "anonymous" group.
            const group = await groups.getBySlug("anonymous");

            if (!group) {
                return [];
            }

            return group?.permissions;
        }
    }
];
