import { ViewPlugin } from "@webiny/ui-composer/View";
import { NavigationView } from "~/views/NavigationView";

interface ApplyFunction {
    (view: NavigationView): void;
}

export class NavigationViewPlugin extends ViewPlugin<NavigationView> {
    static type = "view.admin.navigation";
    private _apply: ApplyFunction;

    constructor(apply?: ApplyFunction) {
        super();

        this._apply = apply;
    }

    apply(view: NavigationView) {
        if (!this._apply) {
            throw Error(
                `You must either pass an "apply" function to NavigationView constructor, or extend the plugin class and override the "apply" method.`
            );
        }

        this._apply(view);
    }
}
