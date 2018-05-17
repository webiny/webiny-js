export default {
    getSecurityRole: {
        id: true,
        name: true,
        slug: true,
        createdOn: true,
        description: true,
        permissions: { id: true, name: true, slug: true }
    },
    listSecurityRoles: {
        list: { id: true, name: true, slug: true, createdOn: true, description: true },
        meta: { count: true, totalCount: true, totalPages: true }
    },
    createSecurityRole: {
        name: true,
        slug: true,
        description: true,
        permissions: { id: true, name: true, slug: true }
    },
    deleteSecurityRole: true,
    updateSecurityRole: {
        id: true,
        name: true,
        slug: true,
        createdOn: true,
        description: true,
        permissions: { id: true, name: true, slug: true }
    }
};
