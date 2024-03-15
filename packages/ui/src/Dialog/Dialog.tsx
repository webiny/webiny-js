import React from "react";
import ReactDOM from "react-dom";
import {
    Dialog as RmwcDialog,
    DialogActions as RmwcDialogActions,
    DialogActionsProps as RmwcDialogActionsProps,
    DialogButton as RmwcDialogButton,
    DialogButtonProps as RmwcDialogButtonProps,
    DialogContent as RmwcDialogContent,
    DialogContentProps as RmwcDialogContentProps,
    DialogOnCloseEventT,
    DialogProps as RmwcDialogProps,
    DialogTitle as RmwcDialogTitle,
    DialogTitleProps as RmwcDialogTitleProps
} from "@rmwc/dialog";
import { css } from "emotion";
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

    children?: React.ReactNode;
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
export const DialogTitle = (props: DialogTitleProps) => (
    <RmwcDialogTitle
        {...getClasses(props, "webiny-ui-dialog__title")}
        style={{ marginBottom: "0" }}
    />
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

export interface DialogActionsProps extends RmwcDialogActionsProps {
    /**
     * Action buttons.
     */
    children: React.ReactNode[] | React.ReactNode;

    // Dialog component's custom in-line styles.
    style?: React.CSSProperties;
}

const addMargin = css`
    button:last-of-type {
        margin-left: 8px;
    }
`;

/**
 * Can be used to show accept and cancel buttons.
 */
export const DialogActions = (props: DialogActionsProps) => (
    <RmwcDialogActions {...getClasses(props, [addMargin, "webiny-ui-dialog__actions"])} />
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
export const DialogButton = (props: DialogButtonProps) => (
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
export const DialogCancel = (props: DialogCancelProps) => {
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
export const DialogAccept = (props: DialogAcceptProps) => {
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
