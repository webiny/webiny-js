export default () => {
    return async (params, next) => {
        // Resolve middleware
        const { route } = params;

        if (route.resolve) {
            params.resolve = await route.resolve({ route });
        }

        next();
    };
};
