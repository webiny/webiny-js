// @flow
import React from "react";
import { compose, withProps, withHandlers } from "recompose";
import { Snackbar } from "webiny-ui/Snackbar";
import _ from "lodash";
import { withUi } from "webiny-app/components";

const SnackbarMain = ({ message, action, hideSnackbar }) => {
    return (
        <Snackbar
            show={!!message}
            onHide={hideSnackbar}
            message={message}
            actionText={action.label}
            actionHandler={action.onClick}
        />
    );
};

export default compose(
    withUi(),
    withProps(props => ({
        message: _.get(props.ui, "snackbar.message"),
        action: _.get(props.ui, "snackbar.options.action", {})
    })),
    withHandlers({
        hideSnackbar: props => () => {
            props.ui.setState(ui => ({ ...ui, snackbar: null }));
        }
    })
)(SnackbarMain);
