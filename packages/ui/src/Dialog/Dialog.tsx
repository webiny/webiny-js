import React from "react";
import ReactDOM from "react-dom";
import {
    Dialog as RmwcDialog,
    DialogProps as RmwcDialogProps,
    DialogOnCloseEventT,
    DialogContent as RmwcDialogContent,
    DialogContentProps as RmwcDialogContentProps,
    DialogTitle as RmwcDialogTitle,
    DialogTitleProps as RmwcDialogTitleProps,
    DialogActions as RmwcDialogActions,
    DialogActionsProps as RmwcDialogActionsProps,
    DialogButton as RmwcDialogButton,
    DialogButtonProps as RmwcDialogButtonProps
} from "@rmwc/dialog";
import { getClasses } from "~/Helpers";

export type DialogOnClose = (event: DialogOnCloseEventT) => void;

export interface DialogProps extends RmwcDialogProps {
    className?: string;

    // Component's custom in-line styles.
    style?: React.CSSProperties;

    // If true, dialog will be permanently fixed inside of a view (works for temporary and persistent modes).
    open?: boolean;

    onClose?: (evt: DialogOnCloseEventT) => void;

    preventOutsideDismiss?: boolean;
}

export class Dialog extends React.Component<DialogProps> {
    container: HTMLElement;

    constructor(props: DialogProps) {
        super(props);
        /**
         * We can safely cast
         */
        this.container = document.getElementById("dialog-container") as HTMLElement;

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.setAttribute("id", "dialog-container");
            const container = this.container;
            document.body && document.body.appendChild(container);
        }
    }

    public override render() {
        const { children, ...props } = this.props;
        const container = this.container;

        // Let's pass "permanent" / "persistent" / "temporary" flags as "mode" prop instead.
        return ReactDOM.createPortal(
            <RmwcDialog {...getClasses(props, "webiny-ui-dialog")}>{children}</RmwcDialog>,
            container
        );
    }
}

export interface DialogTitleProps extends RmwcDialogTitleProps {
    /**
     * Title text.
     */
    children: React.ReactNode[] | React.ReactNode;
}

/**
 * Dialog's header, which can accept DialogHeaderTitle component or any other set of components.
 */
export const DialogTitle: React.FC<DialogTitleProps> = props => (
    <RmwcDialogTitle {...getClasses(props, "webiny-ui-dialog__title")} />
);

export type DialogContentProps = RmwcDialogContentProps & {
    /**
     * Dialog content.
     */
    children: React.ReactNode[] | React.ReactNode;

    className?: string;
};

/**
 * A simple component for showing dialog's body.
 */
export const DialogContent: React.FC<DialogContentProps> = props => (
    <RmwcDialogContent {...getClasses(props, "webiny-ui-dialog__content")} />
);

export interface DialogActionsProps extends RmwcDialogActionsProps {
    /**
     * Action buttons.
     */
    children: React.ReactNode[] | React.ReactNode;

    // Dialog component's custom in-line styles.
    style?: React.CSSProperties;
}

/**
 * Can be used to show accept and cancel buttons.
 */
export const DialogActions: React.FC<DialogActionsProps> = props => (
    <RmwcDialogActions {...getClasses(props, "webiny-ui-dialog__actions")} />
);

interface DialogButtonProps extends RmwcDialogButtonProps {
    /**
     * Callback to execute then button is clicked.
     */
    onClick?: (e: React.MouseEvent) => void;

    className?: string;
}

/**
 * Use this to show a simple button.
 */
export const DialogButton: React.FC<DialogButtonProps> = props => (
    <RmwcDialogButton {...getClasses(props, "webiny-ui-dialog__button")} />
);

interface DialogCancelProps extends RmwcDialogButtonProps {
    /**
     * Callback to execute then button is clicked.
     */
    onClick?: (e: React.MouseEvent) => void;
}

/**
 * Use this to close the dialog without taking any additional action.
 */
export const DialogCancel: React.FC<DialogCancelProps> = props => {
    return (
        <DialogButton
            {...getClasses(props, "webiny-ui-dialog__button webiny-ui-dialog__button--cancel")}
            action="close"
            data-testid="dialog-cancel"
        >
            {props.children}
        </DialogButton>
    );
};

interface DialogAcceptProps extends RmwcDialogButtonProps {
    /**
     * Callback to execute then button is clicked.
     */
    onClick?: (e: React.MouseEvent) => void;
}

/**
 * Use this to close the dialog without taking any additional action.
 */
export const DialogAccept: React.FC<DialogAcceptProps> = props => {
    return (
        <DialogButton
            {...getClasses(props, "webiny-ui-dialog__button webiny-ui-dialog__button--accept")}
            action="accept"
            data-testid="dialog-accept"
        >
            {props.children}
        </DialogButton>
    );
};
