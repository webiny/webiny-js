import React from "react";
import { Snackbar as RmwcSnackbar, SnackbarAction, SnackbarProps } from "@rmwc/snackbar";

type Props = SnackbarProps;

/**
 * Use Snackbar component to display an informative or alert message and allow users to act upon it.
 */
class Snackbar extends React.Component<Props> {
    public readonly container: HTMLElement | null = null;

    public constructor(props: Props) {
        super(props);

        this.container = document.getElementById("snackbar-container");

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.setAttribute("id", "snackbar-container");
            const container: HTMLElement = this.container;
            document.body && document.body.appendChild(container);
        }
    }

    public override render(): React.ReactElement {
        return <RmwcSnackbar {...this.props} />;
    }
}

export { Snackbar, SnackbarAction };
