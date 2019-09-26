// @flow
import * as React from "react";

import {
    Dialog,
    DialogAccept,
    DialogCancel,
    DialogActions,
    DialogTitle,
    DialogContent
} from "./../Dialog";

type Props = {
    // Title of confirmation dialog.
    title?: React.Node,

    // Message of confirmation dialog.
    message?: React.Node,

    // An element that will trigger the confirmation dialog.
    children: ({
        showConfirmation: (onAccept: ?Function, onCancel: ?Function) => any
    }) => React.Node
};

type State = {
    show: boolean
};

/**
 * Use ConfirmationDialog component to display a list of choices, once the handler is triggered.
 */
class ConfirmationDialog extends React.Component<Props, State> {
    static defaultProps = {
        title: "Confirmation",
        message: "Are you sure you want to continue?"
    };

    callbacks: { onAccept: ?Function, onCancel: ?Function } = {
        onAccept: () => {},
        onCancel: () => {}
    };

    state = {
        show: false
    };

    showConfirmation = (onAccept: ?Function, onCancel: ?Function) => {
        this.callbacks = { onAccept, onCancel };
        this.setState({ show: true });
    };

    hideConfirmation = () => {
        this.setState({ show: false });
    };

    onAccept = async () => {
        const { onAccept } = this.callbacks;
        if (typeof onAccept === "function") {
            await onAccept();
        }
    };

    onCancel = async () => {
        const { onCancel } = this.callbacks;
        if (typeof onCancel === "function") {
            await onCancel();
        }
    };

    render() {
        return (
            <React.Fragment>
                <Dialog open={this.state.show} onClose={this.hideConfirmation}>
                    <DialogTitle>{this.props.title}</DialogTitle>
                    <DialogContent>{this.props.message}</DialogContent>
                    <DialogActions>
                        <DialogCancel onClick={this.onCancel}>Cancel</DialogCancel>
                        <DialogAccept onClick={this.onAccept}>Confirm</DialogAccept>
                    </DialogActions>
                </Dialog>
                {this.props.children({
                    showConfirmation: this.showConfirmation
                })}
            </React.Fragment>
        );
    }
}

export { ConfirmationDialog };
