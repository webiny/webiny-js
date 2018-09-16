// @flow
import React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { Snackbar } from "webiny-ui/Snackbar";
import _ from "lodash";
import { hideSnackbar } from "webiny-app-admin/actions";

const SnackbarMain = props => {
    const message = _.get(props, "snackbar.message");
    const action = _.get(props, "snackbar.options.action", {});

    return (
        <Snackbar
            show={!!message}
            onHide={props.hideSnackbar}
            message={message}
            actionText={action.label}
            actionHandler={action.onClick}
        />
    );
};

export default compose(
    connect(
        state => ({
            snackbar: _.get(state, "ui.snackbar")
        }),
        { hideSnackbar }
    )
)(SnackbarMain);
