import React from "react";
import Helmet from "react-helmet";
import { View } from "@webiny/ui-composer/View";
import { Element } from "@webiny/ui-composer/Element";
import { GenericElement } from "@webiny/ui-elements/GenericElement";
import { ViewElement } from "@webiny/ui-elements/ViewElement";
import { HeaderElement } from "./AdminView/HeaderElement";
import { ContentElement } from "./AdminView/ContentElement";
import { AdminViewPlugin } from "~/plugins/AdminViewPlugin";
import { NavigationView } from "~/views/NavigationView";
import Snackbar from "./AdminView/components/Snackbar";
import { DialogContainer } from "./AdminView/components/Dialog";

export class AdminView extends View {
    private _title: string;

    constructor() {
        super("AdminView");

        this.toggleGrid(false);

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
        this.applyPlugin(AdminViewPlugin);
    }

    setTitle(title: string) {
        this._title = title;
    }

    setContentElement(element: Element) {
        const content = this.getContentElement();

        // Remove previous content
        content.getElements().forEach(el => el.remove());

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
