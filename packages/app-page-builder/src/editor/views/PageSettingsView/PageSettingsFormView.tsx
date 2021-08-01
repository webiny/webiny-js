import React from "react";
import { Element } from "@webiny/ui-composer/Element";
import { SimpleFormView } from "@webiny/app-admin/elements/SimpleFormView";
import { PageSettingsView } from "../PageSettingsView";

export class PageSettingsFormView extends SimpleFormView {
    constructor(id) {
        super(id, { setupForm: false });

        this.getSubmitButtonElement().setLabel("Save Settings");
        this.applyPlugins(PageSettingsFormView);
    }

    /**
     * Add a field to form content.
     */
    addField<TElement extends Element = Element>(element: TElement): TElement {
        return this.getFormContentElement().addElement<TElement>(element);
    }

    getPageSettingsHook() {
        const parent = this.getParentOfType<PageSettingsView>(PageSettingsView);
        return parent.getPageSettingsHook();
    }
}
