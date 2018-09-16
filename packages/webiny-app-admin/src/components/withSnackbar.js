// @flow
import * as React from "react";
import { dispatch } from "webiny-app/redux";

import { compose, withProps } from "recompose";
import { showSnackbar } from "webiny-app-admin/actions";

export type WithSnackbarProps = {
    showSnackbar: (message: string, options: ?Object) => void
};

export const withSnackbar = () => {
    return (BaseComponent: React.ComponentType<*>) => {
        return compose(
            withProps(props => {
                return Object.assign({}, props, {
                    showSnackbar: (message, options) => dispatch(showSnackbar({ message, options }))
                });
            })
        )(BaseComponent);
    };
};
