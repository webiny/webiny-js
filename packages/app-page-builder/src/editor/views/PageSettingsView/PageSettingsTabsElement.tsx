import React from "react";
import { Element } from "@webiny/ui-composer/Element";
import { PageSettingsTabsElementRenderer } from "./PageSettingsTabsElementRenderer";

export class PageSettingsTabsElement extends Element {
    constructor(id: string) {
        super(id);

        this.useGrid(false);
        this.addRenderer(new PageSettingsTabsElementRenderer());
    }
}
