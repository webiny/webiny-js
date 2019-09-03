// @flow
import * as React from "react";
import { withUi } from "@webiny/app/components";
import { compose, withHandlers } from "recompose";

export type WithDialogProps = {
    showDialog: (message: string, options: ?Object) => void
};

export const withDialog = () => {
    return (BaseComponent: React.ComponentType<*>) => {
        return compose(
            withUi(),
            withHandlers({
                showDialog: props => (message, options) => {
                    props.ui.setState(ui => {
                        return { ...ui, dialog: { message, options } };
                    });
                }
            })
        )(BaseComponent);
    };
};

