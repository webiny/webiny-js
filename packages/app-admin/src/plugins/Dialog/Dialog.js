// @flow
import React from "react";
import { compose, withProps, withHandlers, setDisplayName } from "recompose";
import {
    Dialog,
    DialogAccept,
    DialogTitle,
    DialogActions,
    DialogContent
} from "@webiny/ui/Dialog";

import _ from "lodash";
import { withUi } from "@webiny/app/components";

const DialogMain = ({ message, options, hideDialog }) => {
    return (
        <Dialog>
            <Dialog open={!!message} onClose={hideDialog}>
                {options.title && (
                    <DialogTitle>{options.title}</DialogTitle>
                )}
                <DialogContent>{message}</DialogContent>
                <DialogActions>
                    <DialogAccept>OK</DialogAccept>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default compose(
    setDisplayName("DialogMain"),
    withUi(),
    withProps(props => ({
        message: _.get(props.ui, "dialog.message"),
        options: _.get(props.ui, "dialog.options", {})
    })),
    withHandlers({
        hideDialog: props => () => {
            props.ui.setState(ui => ({ ...ui, dialog: null }));
        }
    })
)(DialogMain);
