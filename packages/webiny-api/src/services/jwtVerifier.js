export default () => {
    return async ({ token, security }, next, finish) => {
        let identity = security.getIdentityClass(token.data.classId);

        const identityId = token.data.identityId;
        const instance = await identity.findById(identityId);

        if (instance) {
            return finish(instance);
        }

        next();
    };
};
