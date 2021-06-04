import { Plugin } from "@webiny/plugins";
import { Menu, PbContext } from "~/types";

export type CallbackFunction<TParams> = (params: TParams) => void | Promise<void>;

interface MenuParams {
    context: PbContext;
    menu: Menu;
}

interface Config {
    beforeCreate?: CallbackFunction<MenuParams>;
    afterCreate?: CallbackFunction<MenuParams>;
    beforeUpdate?: CallbackFunction<MenuParams>;
    afterUpdate?: CallbackFunction<MenuParams>;
    beforeDelete?: CallbackFunction<MenuParams>;
    afterDelete?: CallbackFunction<MenuParams>;
}

export class MenuPlugin extends Plugin {
    public static readonly type = "pb.menu";
    private _config: Partial<Config>;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    beforeCreate(params: MenuParams): void | Promise<void> {
        return this._execute("beforeCreate", params);
    }

    afterCreate(params: MenuParams): void | Promise<void> {
        return this._execute("afterCreate", params);
    }

    beforeUpdate(params: MenuParams): void | Promise<void> {
        return this._execute("beforeUpdate", params);
    }

    afterUpdate(params: MenuParams): void | Promise<void> {
        return this._execute("afterUpdate", params);
    }

    beforeDelete(params: MenuParams): void | Promise<void> {
        return this._execute("beforeDelete", params);
    }

    afterDelete(params: MenuParams): void | Promise<void> {
        return this._execute("afterDelete", params);
    }

    private _execute(callback, params) {
        if (typeof this._config[callback] === "function") {
            return this._config[callback](params);
        }
    }
}
