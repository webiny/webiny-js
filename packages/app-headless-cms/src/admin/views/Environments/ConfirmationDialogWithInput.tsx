import React from "react";
import { css } from "emotion";
import noop from "lodash/noop";
import {
    Dialog,
    DialogButton,
    DialogCancel,
    DialogActions,
    DialogTitle,
    DialogContent
} from "@webiny/ui/Dialog";
import { Typography } from "@webiny/ui/Typography";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { Alert } from "@webiny/ui/Alert";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/environments/data-list-utils");

const messageStyle = css({
    "& .mdc-dialog__surface": {
        maxWidth: "540px !important"
    },
    "& .mdc-dialog__content": {
        span: {
            display: "inline-block",
            marginBottom: 16
        },
        b: {
            fontWeight: "bold"
        }
    },
    "& .mdc-dialog__actions": {
        alignItems: "center !important"
    },
    "& .mdc-dialog__button": {
        width: "100%",
        "&:nth-child(2)": {
            marginLeft: "0px !important"
        }
    }
});

const confirmButtonStyles = css({
    backgroundColor: "#FED7D7 !important",
    color: "#9B2C2C !important",
    "&:disabled": {
        opacity: 0.4
    }
});

const inputStyles = css({
    margin: "16px 0px"
});

interface ChildrenRenderProp {
    showConfirmation: (onAccept?: Function, onCancel?: Function) => any;
}

interface ConfirmationCallbacks {
    onAccept: Function;
    onCancel: Function;
}

type Props = {
    // Title of confirmation dialog.
    title?: React.ReactNode;

    // Message of confirmation dialog.
    message?: React.ReactNode;

    // This element will be rendered during loading
    loading?: React.ReactNode;

    // For testing purposes.
    "data-testid"?: string;

    // An element that will trigger the confirmation dialog.
    children: (props: ChildrenRenderProp) => React.ReactNode;

    // Is `Confirm` button disabled
    resourceName?: string;
};

type State = {
    show: boolean;
    loading: boolean;
    name: string;
    disableConfirm: boolean;
};

/**
 * Use ConfirmationDialog component to display a list of choices, once the handler is triggered.
 */
class ConfirmationDialogWithInput extends React.Component<Props, State> {
    static defaultProps = {
        title: "Confirmation",
        message: "Are you sure you want to continue?",
        loading: <CircularProgress />,
        resourceName: null
    };

    __isMounted = false;

    callbacks: ConfirmationCallbacks = {
        onAccept: noop,
        onCancel: noop
    };

    state = {
        show: false,
        loading: false,
        name: "",
        disableConfirm: true
    };

    componentDidMount() {
        this.__isMounted = true;
    }

    componentWillUnmount() {
        this.__isMounted = false;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.name === this.state.name) {
            return;
        }

        if (this.state.disableConfirm && this.state.name === this.props.resourceName) {
            this.setState({ disableConfirm: false });
        } else {
            this.setState({ disableConfirm: true });
        }
    }

    showConfirmation = (onAccept?: Function, onCancel?: Function) => {
        this.callbacks = { onAccept, onCancel };
        this.setState({ show: true });
    };

    hideConfirmation = () => {
        this.setState({ show: false });
    };

    onAccept = async () => {
        const { onAccept } = this.callbacks;
        if (typeof onAccept === "function") {
            this.setState({ loading: true });
            await onAccept();
            if (this.__isMounted) {
                this.setState({ loading: false, show: false });
            }
        }
    };

    onCancel = async () => {
        const { onCancel } = this.callbacks;
        if (typeof onCancel === "function") {
            await onCancel();
        }
    };

    handleOnchange = value => {
        this.setState({ name: value });
    };

    render() {
        return (
            <React.Fragment>
                <Dialog
                    className={messageStyle}
                    open={this.state.show}
                    onClose={this.hideConfirmation}
                    data-testid={this.props["data-testid"]}
                >
                    {this.state.loading ? this.props.loading : null}
                    <DialogTitle>{this.props.title}</DialogTitle>
                    <DialogContent>
                        <Alert
                            title={"Wait! Let's review what you're about to do."}
                            type={"warning"}
                        />
                        <Typography use={"body1"}>{this.props.message}</Typography> <br />
                        <Typography use={"body1"}>
                            {t`Please type {resourceName} to confirm.`({
                                resourceName: <b>{this.props.resourceName}</b>
                            })}
                        </Typography>
                        <Input
                            className={inputStyles}
                            value={this.state.name}
                            onChange={this.handleOnchange}
                        />
                    </DialogContent>

                    <DialogActions>
                        <DialogCancel onClick={this.onCancel}>Cancel</DialogCancel>
                        <DialogButton
                            className={confirmButtonStyles}
                            data-testid="confirmationdialog-confirm-action"
                            onClick={this.onAccept}
                            disabled={this.state.disableConfirm}
                        >
                            I understand the consequences, delete this environment
                        </DialogButton>
                    </DialogActions>
                </Dialog>
                {this.props.children({
                    showConfirmation: this.showConfirmation
                })}
            </React.Fragment>
        );
    }
}

export { ConfirmationDialogWithInput };
