// @flow
import React from "react";

export default () => {
    return async (params: Object, next: Function) => {
        const { route, match, resolve } = params;

        if (route.render) {
            params.output = await route.render({ route, match, resolve });
        }

        if (route.component) {
            const component =
                typeof route.component === "function" ? await route.component() : route.component;
            params.output = React.createElement(component, { route, match, resolve });
        }

        if (typeof route.layout === "function") {
            params.output = route.layout(params.output);
        }

        next();
    };
};
