export default () => {
    return async (params, next) => {
        // Resolve middleware
        const { route, match } = params;

        if (route.resolve) {
            params.resolve = await route.resolve({ route, match });
        }

        next();
    };
};
