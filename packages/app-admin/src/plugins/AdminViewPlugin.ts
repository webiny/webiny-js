import { ViewPlugin } from "@webiny/ui-composer/View";
import { AdminView } from "~/views/AdminView";

interface ApplyFunction {
    (view: AdminView): void;
}

export class AdminViewPlugin extends ViewPlugin<AdminView> {
    static type = "view.admin";
    private _apply: ApplyFunction;

    constructor(apply?: ApplyFunction) {
        super();

        this._apply = apply;
    }

    apply(view: AdminView) {
        if (!this._apply) {
            throw Error(
                `You must either pass an "apply" function to AdminViewPlugin constructor, or extend the plugin class and override the "apply" method.`
            );
        }

        this._apply(view);
    }
}
