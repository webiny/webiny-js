export default {
    getSecurityPermission: {
        id: true,
        name: true,
        slug: true,
        scope: true,
        savedOn: true,
        createdOn: true,
        updatedOn: true,
        description: true
    },
    listSecurityPermissions: {
        list: {
            id: true,
            name: true,
            slug: true,
            scope: true,
            savedOn: true,
            createdOn: true,
            updatedOn: true,
            description: true
        },
        meta: { count: true, totalCount: true, totalPages: true }
    },
    createSecurityPermission: {
        id: true,
        name: true,
        slug: true,
        scope: true,
        savedOn: true,
        createdOn: true,
        updatedOn: true,
        description: true
    },
    deleteSecurityPermission: true,
    updateSecurityPermission: {
        id: true,
        name: true,
        slug: true,
        scope: true,
        savedOn: true,
        createdOn: true,
        updatedOn: true,
        description: true
    }
};
