import { UIViewPlugin } from "@webiny/ui-composer/UIView";
import { UsersFormView } from "~/views/Users/UsersFormView";

export abstract class UsersFormViewPlugin extends UIViewPlugin<UsersFormView> {
    static type = "UsersFormViewPlugin";
}
