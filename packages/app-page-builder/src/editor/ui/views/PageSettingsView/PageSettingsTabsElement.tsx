import { UIElement } from "@webiny/app-admin/ui/UIElement";
import { PageSettingsTabsElementRenderer } from "./PageSettingsTabsElementRenderer";

export class PageSettingsTabsElement extends UIElement {
    constructor(id: string) {
        super(id);

        this.useGrid(false);
        this.addRenderer(new PageSettingsTabsElementRenderer());
    }
}
