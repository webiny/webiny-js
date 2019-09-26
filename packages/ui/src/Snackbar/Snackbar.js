// @flow
import * as React from "react";
import { Snackbar as RmwcSnackbar, SnackbarAction } from "@rmwc/snackbar";

type Props = {
    // Show the Snackbar.
    show: boolean,

    // A callback thats fired when the Snackbar shows.
    onShow?: () => mixed,

    // A callback thats fired when the Snackbar hides.
    onClose: () => mixed,

    // A string or other renderable JSX to be used as the message body.
    message: React.Node,

    // Milliseconds to show the Snackbar for.
    timeout?: number,

    // Lets the Snackbar text overflow onto multiple lines.
    multiline?: boolean,

    // Places the action underneath the message text.
    actionOnBottom?: boolean,

    // Whether or not the Snackbar dismisses on the action press.
    dismissesOnAction?: boolean
};

/**
 * Use Snackbar component to display an informative or alert message and allow users to act upon it.
 * @param props
 * @returns {*}
 * @constructor
 */
class Snackbar extends React.Component<Props> {
    container: ?Element;

    constructor() {
        super();

        this.container = document.getElementById("snackbar-container");

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.setAttribute("id", "snackbar-container");
            const container: Element = (this.container: any);
            document.body && document.body.appendChild(container);
        }
    }

    render() {
        return <RmwcSnackbar {...this.props} />;
    }
}

export { Snackbar, SnackbarAction };
