import { ViewPlugin } from "~/views/Users/View";
import { UsersFormView } from "~/views/Users/UsersFormView";

export abstract class UsersFormViewPlugin extends ViewPlugin<UsersFormView> {
    static type = "view.users.form";
}
