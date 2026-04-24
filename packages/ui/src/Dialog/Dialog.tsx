import React from "react";
import {
    Button as AdminUiButton,
    type ButtonProps as AdminUiButtonProps,
    Dialog as AdminUiDialog,
    type DialogProps as AdminUiDialogProps
} from "@webiny/admin-ui";
import { DialogHeader as AdminUiDialogHeader } from "@webiny/admin-ui/Dialog/components/DialogHeader.js";
import { DialogFooter as AdminUiDialogFooter } from "@webiny/admin-ui/Dialog/components/DialogFooter.js";
import { DialogClose as AdminUiDialogClose } from "@webiny/admin-ui/Dialog/components/DialogClose.js";
import { DialogBody } from "@webiny/admin-ui/Dialog/components/DialogBody.js";

export interface DialogActionsProps {
    children: React.ReactNode[] | React.ReactNode;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Dialog` component from the `@webiny/admin-ui` package instead.
 */
export const DialogActions = (props: DialogActionsProps) => {
    return <AdminUiDialogFooter actions={props.children} />;
};

export interface DialogButtonProps extends AdminUiButtonProps {
    children?: React.ReactNode[] | React.ReactNode;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Dialog` component from the `@webiny/admin-ui` package instead.
 */
export const DialogButton = (props: DialogButtonProps) => {
    return <AdminUiButton {...props} variant={"secondary"} text={props.text || props.children} />;
};

export interface DialogAcceptProps extends AdminUiButtonProps {
    children?: React.ReactNode[] | React.ReactNode;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Dialog` component from the `@webiny/admin-ui` package instead.
 */
export const DialogAccept = (props: DialogAcceptProps) => {
    return <AdminUiButton {...props} variant={"primary"} text={props.text || props.children} />;
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Dialog` component from the `@webiny/admin-ui` package instead.
 */
export const DialogCancel = (props: DialogButtonProps) => {
    return (
        <AdminUiDialogClose asChild>
            <AdminUiButton {...props} variant={"secondary"} text={props.text || props.children} />
        </AdminUiDialogClose>
    );
};

DialogActions.displayName = "DialogActions";

export interface DialogContentProps {
    children: React.ReactNode[] | React.ReactNode;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Dialog` component from the `@webiny/admin-ui` package instead.
 */
export const DialogContent = (props: DialogContentProps) => {
    return <DialogBody>{props.children}</DialogBody>;
};

DialogContent.displayName = "DialogContent";

export interface DialogTitleProps {
    children: React.ReactNode[] | React.ReactNode;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Dialog` component from the `@webiny/admin-ui` package instead.
 */
export const DialogTitle = (props: DialogTitleProps) => {
    return <AdminUiDialogHeader title={props.children} />;
};

DialogTitle.displayName = "DialogTitle";

export type DialogOnClose = () => void;

export interface DialogProps extends AdminUiDialogProps {
    onClose?: DialogOnClose;
    onOpened?: () => void;
    preventOutsideDismiss?: boolean;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Dialog` component from the `@webiny/admin-ui` package instead.
 */
export const Dialog = ({
    onClose,
    onOpened,
    open,
    showCloseButton,
    children,
    preventOutsideDismiss,
    ...rest
}: DialogProps) => {
    return (
        <AdminUiDialog
            open={open}
            bodyPadding={false}
            dismissible={preventOutsideDismiss === true ? false : true}
            showCloseButton={showCloseButton}
            onClose={onClose}
            onOpen={onOpened}
            {...rest}
        >
            {children}
        </AdminUiDialog>
    );
};
