import { Plugin } from "@webiny/plugins";
import { AdminUsersContext, User as BaseUser } from "~/types";

type PromiseVoid = void | Promise<void>;

export interface CreateParams<User, Context> {
    context: Context;
    user: User;
    inputData: Record<string, any>;
}

export interface BeforeUpdateParams<User, Context> {
    context: Context;
    user: User;
    readonly inputData: Record<string, any>;
    updateData: Partial<User>;
}

export interface AfterUpdateParams<User, Context> {
    context: Context;
    user: User;
    readonly inputData: Record<string, any>;
}

export interface DeleteParams<User, Context> {
    context: Context;
    user: User;
}

export interface OnLoginParams<User, Context> {
    context: Context;
    user: User;
    firstLogin: boolean;
}

interface Config<
    User extends BaseUser = BaseUser,
    Context extends AdminUsersContext = AdminUsersContext
> {
    beforeCreate?: (params: CreateParams<User, Context>) => PromiseVoid;
    afterCreate?: (params: CreateParams<User, Context>) => PromiseVoid;
    beforeUpdate?: (params: BeforeUpdateParams<User, Context>) => PromiseVoid;
    afterUpdate?: (params: AfterUpdateParams<User, Context>) => PromiseVoid;
    beforeDelete?: (params: DeleteParams<User, Context>) => PromiseVoid;
    afterDelete?: (params: DeleteParams<User, Context>) => PromiseVoid;
    onLogin?: (params: OnLoginParams<User, Context>) => PromiseVoid;
}

export class UserPlugin<
    User extends BaseUser = BaseUser,
    Context extends AdminUsersContext = AdminUsersContext
> extends Plugin {
    public static readonly type = "security.user";
    private readonly _config: Config<User, Context>;

    constructor(config?: Config<User, Context>) {
        super();
        this._config = config || {};
    }

    beforeCreate(params: CreateParams<User, Context>): PromiseVoid {
        return this._execute("beforeCreate", params);
    }

    afterCreate(params: CreateParams<User, Context>): PromiseVoid {
        return this._execute("afterCreate", params);
    }

    afterUpdate(params: AfterUpdateParams<User, Context>): PromiseVoid {
        return this._execute("afterUpdate", params);
    }

    beforeUpdate(params: BeforeUpdateParams<User, Context>): PromiseVoid {
        return this._execute("beforeUpdate", params);
    }

    beforeDelete(params: DeleteParams<User, Context>): PromiseVoid {
        return this._execute("beforeDelete", params);
    }

    afterDelete(params: DeleteParams<User, Context>): PromiseVoid {
        return this._execute("afterDelete", params);
    }

    onLogin(params: OnLoginParams<User, Context>): PromiseVoid {
        return this._execute("onLogin", params);
    }

    private _execute(callback, params) {
        if (typeof this._config[callback] === "function") {
            return this._config[callback](params);
        }
    }
}
