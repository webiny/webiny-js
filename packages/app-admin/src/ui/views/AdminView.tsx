import React from "react";
import Helmet from "react-helmet";
import { UIView } from "~/ui/UIView";
import { UIElement } from "~/ui/UIElement";
import { GenericElement } from "~/ui/elements/GenericElement";
import { ViewElement } from "~/ui/elements/ViewElement";
import { HeaderElement } from "./AdminView/HeaderElement";
import { ContentElement } from "./AdminView/ContentElement";
import { NavigationView } from "~/ui/views/NavigationView";
import Snackbar from "./AdminView/components/Snackbar";
import { DialogContainer } from "./AdminView/components/Dialog";

export class AdminView extends UIView {
    private _title: string;

    constructor() {
        super("AdminView");

        this.useGrid(false);

        this.addElement(
            new GenericElement("helmet", () => {
                return this._title ? <Helmet title={this._title} /> : null;
            })
        );

        this.addElement(new HeaderElement("header"));
        this.addElement(new ContentElement("content"));
        this.addElement(new ViewElement("navigation", { view: new NavigationView() }));
        this.addElement(new GenericElement("snackbarContainer", () => <Snackbar />));
        this.addElement(new GenericElement("dialogContainer", () => <DialogContainer />));

        // Apply plugins
        this.applyPlugins(AdminView);
    }

    setTitle(title: string) {
        this._title = title;
    }

    setContentElement(element: UIElement) {
        const content = this.getContentElement();

        // Remove previous content
        content.getChildren().forEach(el => el.remove());

        // Add new content
        content.addElement(element);
    }

    getHeaderElement(): HeaderElement {
        return this.getElement("header");
    }

    getContentElement(): ContentElement {
        return this.getElement("content");
    }
}
