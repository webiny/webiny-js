import * as React from "react";
import { Snackbar as RmwcSnackbar, SnackbarAction, SnackbarProps } from "@rmwc/snackbar";

type Props = SnackbarProps;

/**
 * Use Snackbar component to display an informative or alert message and allow users to act upon it.
 * @param props
 * @returns {*}
 * @constructor
 */
class Snackbar extends React.Component<Props> {
    container?: Element;

    constructor(props) {
        super(props);

        this.container = document.getElementById("snackbar-container");

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.setAttribute("id", "snackbar-container");
            const container: Element = this.container;
            document.body && document.body.appendChild(container);
        }
    }

    render() {
        return <RmwcSnackbar {...this.props} />;
    }
}

export { Snackbar, SnackbarAction };
