export default {
    getSecurityUser: {
        id: true,
        email: true,
        roles: true,
        enabled: true,
        savedOn: true,
        gravatar: true,
        lastName: true,
        password: true,
        createdOn: true,
        firstName: true,
        updatedOn: true,
        roleGroups: true
    },
    listSecurityUsers: {
        list: {
            id: true,
            email: true,
            roles: true,
            enabled: true,
            savedOn: true,
            gravatar: true,
            lastName: true,
            password: true,
            createdOn: true,
            firstName: true,
            updatedOn: true,
            roleGroups: true
        },
        meta: { count: true, totalCount: true, totalPages: true }
    },
    createSecurityUser: {
        id: true,
        email: true,
        roles: true,
        enabled: true,
        savedOn: true,
        gravatar: true,
        lastName: true,
        password: true,
        createdOn: true,
        firstName: true,
        updatedOn: true,
        roleGroups: true
    },
    deleteSecurityUser: true,
    updateSecurityUser: {
        id: true,
        email: true,
        roles: {},
        enabled: true,
        savedOn: true,
        gravatar: true,
        lastName: true,
        password: true,
        createdOn: true,
        firstName: true,
        updatedOn: true,
        roleGroups: true
    }
};
