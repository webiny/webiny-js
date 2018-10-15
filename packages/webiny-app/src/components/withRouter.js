// @flow
import * as React from "react";
import { router } from "webiny-app/router";
import type { Router } from "webiny-react-router";
import { withProps } from "recompose";

export type WithRouterProps = {
    router: Router
};

export const withRouter = (): Function => {
    return (BaseComponent: typeof React.Component) => {
        return withProps({ router })(BaseComponent);
    };
};
