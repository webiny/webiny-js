import { UIElement } from "@webiny/ui-composer/UIElement";
import { UserMenuRenderer } from "~/elements/UserMenuElement/UserMenuRenderer";

export class UserMenuElement extends UIElement {
    private _menuHandleElement: UIElement;

    constructor() {
        super("userMenu");

        this.useGrid(false);

        this.addRenderer(new UserMenuRenderer());
    }

    setMenuHandleElement(element: UIElement) {
        this._menuHandleElement = element;
    }

    getMenuHandleElement() {
        return this._menuHandleElement;
    }
}
