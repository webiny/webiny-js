import * as React from "react";
import ReactDOM from "react-dom";
import {
    Dialog as RmwcDialog,
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
import { getClasses } from "@webiny/ui/Helpers";

export type DialogOnClose = (event: DialogOnCloseEventT) => void;

export type DialogProps = {
    children: any;

    className?: string;

    style?: { [key: string]: any };

    // If true, dialog will be permanently fixed inside of a view (works for temporary and persistent modes).
    open?: boolean;

    onClose?: (evt: DialogOnCloseEventT) => void;

    preventOutsideDismiss?: boolean;
};

export class Dialog extends React.Component<DialogProps> {
    container?: Element;

    constructor(props) {
        super(props);

        this.container = document.getElementById("dialog-container");

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.setAttribute("id", "dialog-container");
            const container: Element = this.container;
            document.body && document.body.appendChild(container);
        }
    }

    render() {
        const { children, ...props } = this.props;
        const container: Element = this.container;

        // Let's pass "permanent" / "persistent" / "temporary" flags as "mode" prop instead.
        return ReactDOM.createPortal(
            <RmwcDialog {...getClasses(props, "webiny-ui-dialog")}>{children}</RmwcDialog>,
            container
        );
    }
}

export type DialogTitleProps = RmwcDialogTitleProps & {
    /**
     * Title text.
     */
    children: React.ReactNode[] | React.ReactNode;
};

/**
 * Dialog's header, which can accept DialogHeaderTitle component or any other set of components.
 */
export const DialogTitle = (props: DialogTitleProps) => (
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
export const DialogContent = (props: DialogContentProps) => (
    <RmwcDialogContent {...getClasses(props, "webiny-ui-dialog__content")} />
);

export type DialogActionsProps = RmwcDialogActionsProps & {
    /**
     * Action buttons.
     */
    children: React.ReactNode[] | React.ReactNode;

    style?: object;
};

/**
 * Can be used to show accept and cancel buttons.
 */
export const DialogActions = (props: DialogActionsProps) => (
    <RmwcDialogActions {...getClasses(props, "webiny-ui-dialog__actions")} />
);

type DialogButtonProps = RmwcDialogButtonProps & {
    /**
     * Callback to execute then button is clicked.
     */
    onClick?: (e: React.MouseEvent) => void;
};

/**
 * Use this to show a simple button.
 */
export const DialogButton = (props: DialogButtonProps) => (
    <RmwcDialogButton {...getClasses(props, "webiny-ui-dialog__button")} />
);

type DialogCancelProps = RmwcDialogButtonProps & {
    /**
     * Children elements.
     */
    children: React.ReactNode;

    /**
     * Callback to execute then button is clicked.
     */
    onClick?: (e: React.MouseEvent) => void;
};

/**
 * Use this to close the dialog without taking any additional action.
 */
export const DialogCancel = (props: DialogCancelProps) => {
    return (
        <DialogButton
            {...getClasses(props, "webiny-ui-dialog__button webiny-ui-dialog__button--cancel")}
            action="close"
        >
            {props.children}
        </DialogButton>
    );
};

type DialogAcceptProps = RmwcDialogButtonProps & {
    /**
     * Children elements.
     */
    children: React.ReactNode;

    /**
     * Callback to execute then button is clicked.
     */
    onClick?: (e: React.MouseEvent) => void;
};

/**
 * Use this to close the dialog without taking any additional action.
 */
export const DialogAccept = (props: DialogAcceptProps) => {
    return (
        <DialogButton
            {...getClasses(props, "webiny-ui-dialog__button webiny-ui-dialog__button--accept")}
            action="accept"
        >
            {props.children}
        </DialogButton>
    );
};
