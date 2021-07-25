import { ViewPlugin } from "@webiny/ui-composer/View";
import { NavigationView } from "~/views/NavigationView";

export class NavigationViewPlugin extends ViewPlugin<NavigationView> {
    static type = "view.admin.navigation";
}
