export default {
    getIdentity: true,
    loginSecurityUser: {
        token: true,
        identity: {
            id: true,
            email: true,
            roles: { slug: true },
            gravatar: true,
            lastName: true,
            firstName: true,
            roleGroups: { id: true, name: true, roles: { slug: true } }
        },
        expiresOn: true
    }
};
