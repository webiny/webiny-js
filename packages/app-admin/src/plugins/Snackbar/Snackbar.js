// @flow
import React from "react";
import { compose, withProps, withHandlers, setDisplayName } from "recompose";
import { Snackbar } from "@webiny/ui/Snackbar";
import _ from "lodash";
import { withUi } from "@webiny/app/components";

const SnackbarMain = ({ message, options, hideSnackbar }) => {
    return <Snackbar open={!!message} onClose={hideSnackbar} message={message} {...options} />;
};

export default compose(
    setDisplayName("SnackbarMain"),
    withUi(),
    withProps(props => ({
        message: _.get(props.ui, "snackbar.message"),
        options: _.get(props.ui, "snackbar.options", {})
    })),
    withHandlers({
        hideSnackbar: props => () => {
            props.ui.setState(ui => ({ ...ui, snackbar: null }));
        }
    })
)(SnackbarMain);
