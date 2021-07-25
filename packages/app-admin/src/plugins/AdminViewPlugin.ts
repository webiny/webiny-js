import { ViewPlugin } from "@webiny/ui-composer/View";
import { AdminView } from "~/views/AdminView";

export class AdminViewPlugin extends ViewPlugin<AdminView> {
    static type = "view.admin";
}
