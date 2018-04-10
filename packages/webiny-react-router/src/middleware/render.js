import React from "react";

export default () => {
    return async (params, next) => {
        const { route, match, resolve } = params;

        if (route.render) {
            params.output = route.render({ route, match, resolve });
        }

        if (route.component) {
            const component = await route.component();
            params.output = React.createElement(component, { route, match, resolve });
        }

        if (typeof route.layout === "function") {
            params.output = route.layout(params.output);
        }

        next();
    };
};
