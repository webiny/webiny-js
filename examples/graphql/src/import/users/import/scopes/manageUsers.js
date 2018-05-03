export default {
    getSecurityUser: {
        id: true,
        email: true,
        roles: { id: true, name: true, slug: true },
        enabled: true,
        savedOn: true,
        gravatar: true,
        lastName: true,
        password: true,
        createdOn: true,
        firstName: true,
        updatedOn: true,
        roleGroups: { id: true, name: true, slug: true }
    },
    listSecurityUsers: {
        list: {
            id: true,
            email: true,
            roles: { id: true, name: true, slug: true },
            enabled: true,
            savedOn: true,
            gravatar: true,
            lastName: true,
            password: true,
            createdOn: true,
            firstName: true,
            updatedOn: true,
            roleGroups: { name: true, slug: true }
        },
        meta: { count: true, totalCount: true, totalPages: true }
    },
    createSecurityUser: {
        id: true,
        email: true,
        roles: { id: true, name: true, slug: true },
        enabled: true,
        savedOn: true,
        gravatar: true,
        lastName: true,
        password: true,
        createdOn: true,
        firstName: true,
        updatedOn: true,
        roleGroups: { id: true, name: true, slug: true }
    },
    deleteSecurityUser: true,
    updateSecurityUser: {
        id: true,
        email: true,
        roles: { id: true, name: true, slug: true },
        enabled: true,
        savedOn: true,
        gravatar: true,
        lastName: true,
        password: true,
        createdOn: true,
        firstName: true,
        updatedOn: true,
        roleGroups: { id: true, name: true, slug: true }
    }
};
