import { UIElement } from "@webiny/ui-composer/UIElement";
import { PageSettingsTabsElementRenderer } from "./PageSettingsTabsElementRenderer";

export class PageSettingsTabsElement extends UIElement {
    constructor(id: string) {
        super(id);

        this.useGrid(false);
        this.addRenderer(new PageSettingsTabsElementRenderer());
    }
}
