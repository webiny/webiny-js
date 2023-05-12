import React from "react";

import { Dialog, DialogCancel, DialogActions, DialogTitle, DialogContent } from "./../Dialog";

import { CircularProgress } from "../Progress";
import { ButtonPrimary } from "~/Button";

interface ChildrenRenderProp {
    showConfirmation: (onAccept?: () => void, onCancel?: () => void) => any;
}

interface ConfirmationCallbacks {
    onAccept?: () => void;
    onCancel?: () => void;
}

interface Props {
    // Title of confirmation dialog
    title?: React.ReactNode;

    // Message of confirmation dialog
    message?: React.ReactNode;

    // This element will be rendered during loading
    loading?: React.ReactNode;

    // For testing purposes
    "data-testid"?: string;

    // An element that will trigger the confirmation dialog.
    children: (props: ChildrenRenderProp) => React.ReactNode;

    // Is `Confirm` button disabled
    disableConfirm?: boolean;

    // Dialog component's custom in-line styles.
    style?: React.CSSProperties;
}

interface ConfirmationDialogState {
    show: boolean;
    loading: boolean;
}

/**
 * Use ConfirmationDialog component to display a list of choices, once the handler is triggered.
 */
class ConfirmationDialog extends React.Component<Props, ConfirmationDialogState> {
    static defaultProps = {
        title: "Confirmation",
        message: "Are you sure you want to continue?",
        loading: <CircularProgress />
    };

    __isMounted = false;

    callbacks: ConfirmationCallbacks = {
        onAccept: () => {
            return void 0;
        },
        onCancel: () => {
            return void 0;
        }
    };

    public override state = {
        show: false,
        loading: false
    };

    public override componentDidMount() {
        this.__isMounted = true;
    }

    public override componentWillUnmount() {
        this.__isMounted = false;
    }

    private readonly showConfirmation = (onAccept?: () => void, onCancel?: () => void) => {
        this.callbacks = {
            onAccept,
            onCancel
        };
        this.setState({ show: true });
    };

    private readonly hideConfirmation = () => {
        this.setState({ show: false });
    };

    private readonly onAccept = async () => {
        const { onAccept } = this.callbacks;
        if (typeof onAccept === "function") {
            this.setState({ loading: true });
            await onAccept();
            if (this.__isMounted) {
                this.setState({ loading: false, show: false });
            }
        }
    };

    private readonly onCancel = async () => {
        const { onCancel } = this.callbacks;
        if (typeof onCancel === "function") {
            await onCancel();
        }
    };

    public override render() {
        return (
            <React.Fragment>
                <Dialog
                    style={this.props.style}
                    open={this.state.show}
                    onClose={this.hideConfirmation}
                    data-testid={this.props["data-testid"]}
                >
                    {this.state.loading ? this.props.loading : null}
                    <DialogTitle>{this.props.title}</DialogTitle>
                    <DialogContent>{this.props.message}</DialogContent>
                    <DialogActions>
                        <DialogCancel onClick={this.onCancel}>Cancel</DialogCancel>
                        <ButtonPrimary
                            data-testid="confirmationdialog-confirm-action"
                            onClick={this.onAccept}
                            disabled={this.props.disableConfirm}
                        >
                            Confirm
                        </ButtonPrimary>
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
