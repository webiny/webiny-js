// @flow
import * as React from "react";
import { withUi } from "@webiny/app/components";
import { compose, withHandlers } from "recompose";

export type WithSnackbarProps = {
    showSnackbar: (message: string, options: ?Object) => void,
    hideSnackbar: () => void
};

export const withSnackbar = () => {
    return (BaseComponent: React.ComponentType<*>) => {
        return compose(
            withUi(),
            withHandlers({
                showSnackbar: props => (message, options) => {
                    props.ui.setState(ui => {
                        return { ...ui, snackbar: { message, options } };
                    });
                },
                hideSnackbar: props => () => {
                    props.ui.setState(ui => {
                        return { ...ui, snackbar: null };
                    });
                }
            })
        )(BaseComponent);
    };
};
