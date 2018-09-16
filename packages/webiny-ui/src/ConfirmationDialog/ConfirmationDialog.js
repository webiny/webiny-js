// @flow
import * as React from "react";

import {
    Dialog,
    DialogAccept,
    DialogCancel,
    DialogFooter,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody
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

    render() {
        return (
            <React.Fragment>
                <Dialog open={this.state.show} onClose={this.hideConfirmation}>
                    <DialogHeader>
                        <DialogHeaderTitle>{this.props.title}</DialogHeaderTitle>
                    </DialogHeader>
                    <DialogBody>{this.props.message}</DialogBody>
                    <DialogFooter>
                        <DialogCancel
                            onClick={async () => {
                                const { onCancel } = this.callbacks;
                                if (typeof onCancel === "function") {
                                    await onCancel();
                                }
                            }}
                        >
                            Cancel
                        </DialogCancel>

                        <DialogAccept
                            onClick={async () => {
                                const { onAccept } = this.callbacks;
                                if (typeof onAccept === "function") {
                                    await onAccept();
                                }
                            }}
                        >
                            Confirm
                        </DialogAccept>
                    </DialogFooter>
                </Dialog>
                {this.props.children({
                    showConfirmation: this.showConfirmation
                })}
            </React.Fragment>
        );
    }
}

export { ConfirmationDialog };
