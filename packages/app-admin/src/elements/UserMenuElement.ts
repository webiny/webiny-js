import { Element } from "@webiny/ui-composer/Element";
import { UserMenuRenderer } from "~/elements/UserMenuElement/UserMenuRenderer";

export class UserMenuElement extends Element {
    private _menuHandleElement: Element;

    constructor() {
        super("userMenu");

        this.useGrid(false);

        this.addRenderer(new UserMenuRenderer());
    }

    setMenuHandleElement(element: Element) {
        this._menuHandleElement = element;
    }

    getMenuHandleElement() {
        return this._menuHandleElement;
    }
}
