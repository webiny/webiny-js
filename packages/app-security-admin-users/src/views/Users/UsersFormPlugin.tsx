import { plugins, Plugin } from "@webiny/plugins";
import {BindComponent} from "@webiny/form";

interface Config {
    renderForm(): any;
    renderFields(): any;
}

export class UsersFormPlugin extends Plugin {
    public static readonly type = "admin.users.form";
    private _config: Partial<Config>;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }
    
    renderForm(props) {
        
    }

    renderFields(props) {

    }
}
