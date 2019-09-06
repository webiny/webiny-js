// @flow
import * as React from "react";
import ReactDOM from "react-dom";
import {
    Dialog as RmwcDialog,
    DialogContent as RmwcDialogContent,
    DialogTitle as RmwcDialogTitle,
    DialogActions as RmwcDialogActions,
    DialogButton as RmwcDialogButton
} from "@rmwc/dialog";

type Props = {
    children: any,

    // If true, dialog will be permanently fixed inside of a view (works for temporary and persistent modes).
    open?: boolean
};

/**
 * Use Dialog component to display an informative or alert message and allow users to act upon it.
 * @param props
 * @returns {*}
 * @constructor
 */
export class Dialog extends React.Component<Props> {
    container: ?Element;

    constructor() {
        super();

        this.container = document.getElementById("dialog-container");

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.setAttribute("id", "dialog-container");
            const container: Element = (this.container: any);
            document.body && document.body.appendChild(container);
        }
    }

    render() {
        const { children, ...props } = this.props;
        const container: Element = (this.container: any);

        // Let's pass "permanent" / "persistent" / "temporary" flags as "mode" prop instead.
        return ReactDOM.createPortal(<RmwcDialog {...props}>{children}</RmwcDialog>, container);
    }
}

/**
 * Dialog's header, which can accept DialogHeaderTitle component or any other set of components.
 * @param props
 * @returns {*}
 * @constructor
 */
export const DialogTitle = (props: Object) => <RmwcDialogTitle {...props} />;

/**
 * A simple component for showing dialog's body.
 * @param props
 * @returns {*}
 * @constructor
 */
export const DialogContent = (props: Object) => <RmwcDialogContent {...props} />;

/**
 * Can be used to show accept and cancel buttons.
 * @param props
 * @returns {*}
 * @constructor
 */
export const DialogActions = (props: Object) => <RmwcDialogActions {...props} />;

/**
 * Use this to show a simple button.
 * @param props
 * @returns {*}
 * @constructor
 */
export const DialogButton = (props: Object) => <RmwcDialogButton {...props} />;

/**
 * Use this to close the dialog without taking any additional action.
 * @param props
 * @returns {*}
 * @constructor
 */
export const DialogCancel = (props: { children: React.Node }) => {
    return (
        <DialogButton {...props} action="close">
            {props.children}
        </DialogButton>
    );
};

/**
 * Use this to close the dialog without taking any additional action.
 * @param props
 * @returns {*}
 * @constructor
 */
export const DialogAccept = (props: { children: React.Node }) => {
    return (
        <DialogButton {...props} action="accept">
            {props.children}
        </DialogButton>
    );
};
