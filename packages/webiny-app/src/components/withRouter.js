// @flow
import * as React from "react";
import { router } from "webiny-app/router";

import { connect } from "react-redux";
import { compose } from "recompose";
import _ from "lodash";

const emptyObject = {};

export type WithRouterProps = {
    router: typeof router
};

export const withRouter = (): Function => {
    return (BaseComponent: typeof React.Component) => {
        return compose(
            connect(
                state => ({
                    route: _.get(state, `ui.route`, emptyObject)
                }),
                null,
                (stateProps, dispatchProps, ownProps) => {
                    return {
                        ...ownProps,
                        ...stateProps,
                        router
                    };
                },
                {
                    areStatePropsEqual: (next, previous) => {
                        return _.isEqual(previous.route, next.route);
                    }
                }
            )
        )(BaseComponent);
    };
};
