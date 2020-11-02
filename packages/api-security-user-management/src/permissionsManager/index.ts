import crud from "../crud";

export default () => [
    crud(),
    {
        type: "permissions-manager-middleware",
        async getPermissions({ identity }, context) {
            const { users, groups } = context;
            if (identity) {
                const user = await users.get(identity);

                if (!user) {
                    throw Error(`User "${identity}" was not found!`);
                }

                const group = await groups.get(user.group);
                return group?.data?.permissions;
            }

            // Identity is "anonymous", and we need to load permissions from the "anonymous" group.
            const group = await groups.getBySlug("anonymous");

            if (!group) {
                return [];
            }

            return group?.GSI_DATA?.permissions;
        }
    }
];
