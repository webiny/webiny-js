import * as React from "react";
import { DialogContentProps as RmwcDialogContentProps, DialogTitleProps as RmwcDialogTitleProps, DialogActionsProps as RmwcDialogActionsProps, DialogButtonProps as RmwcDialogButtonProps } from "@rmwc/dialog";
export declare type DialogProps = {
    children: any;
    className?: string;
    style?: {
        [key: string]: any;
    };
    open?: boolean;
    onClose?: (e: React.MouseEvent) => void;
};
export declare class Dialog extends React.Component<DialogProps> {
    container?: Element;
    constructor(props: any);
    render(): any;
}
export declare type DialogTitleProps = RmwcDialogTitleProps & {
    /**
     * Title text.
     */
    children: React.ReactNode[] | React.ReactNode;
};
/**
 * Dialog's header, which can accept DialogHeaderTitle component or any other set of components.
 */
export declare const DialogTitle: (props: DialogTitleProps) => JSX.Element;
export declare type DialogContentProps = RmwcDialogContentProps & {
    /**
     * Dialog content.
     */
    children: React.ReactNode[] | React.ReactNode;
};
/**
 * A simple component for showing dialog's body.
 */
export declare const DialogContent: (props: DialogContentProps) => JSX.Element;
export declare type DialogActionsProps = RmwcDialogActionsProps & {
    /**
     * Action buttons.
     */
    children: React.ReactNode[] | React.ReactNode;
};
/**
 * Can be used to show accept and cancel buttons.
 */
export declare const DialogActions: (props: DialogActionsProps) => JSX.Element;
declare type DialogButtonProps = RmwcDialogButtonProps & {
    /**
     * Callback to execute then button is clicked.
     */
    onClick?: (e: React.MouseEvent) => void;
};
/**
 * Use this to show a simple button.
 */
export declare const DialogButton: (props: DialogButtonProps) => JSX.Element;
declare type DialogCancelProps = RmwcDialogButtonProps & {
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
export declare const DialogCancel: (props: DialogCancelProps) => JSX.Element;
declare type DialogAcceptProps = RmwcDialogButtonProps & {
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
export declare const DialogAccept: (props: DialogAcceptProps) => JSX.Element;
export {};
