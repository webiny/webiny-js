import { Plugin } from "@webiny/plugins";
import { Menu, MenuItem, PbContext } from "~/types";

export type CallbackFunction<TParams> = (params: TParams) => void | Promise<void>;

interface MenuParams<TMenu = Menu> {
    context: PbContext;
    menu: TMenu;
}

interface MenuPluginConfigParams<TMenu, TMenuItem> extends MenuParams<TMenu> {
    items: TMenuItem[];
    index: number;
    originalValue: TMenuItem;
}

interface Config<TParams> {
    beforeCreate?: CallbackFunction<TParams>;
    afterCreate?: CallbackFunction<TParams>;
    beforeUpdate?: CallbackFunction<TParams>;
    afterUpdate?: CallbackFunction<TParams>;
    beforeDelete?: CallbackFunction<TParams>;
    afterDelete?: CallbackFunction<TParams>;
    modifyMenuItemProperties?: CallbackFunction<TParams>;
}

export class MenuPlugin<TMenu = Menu, TMenuItem = MenuItem> extends Plugin {
    public static readonly type = "pb.menu";
    private _config: Partial<Config<MenuPluginConfigParams<TMenu, TMenuItem>>>;

    constructor(config?: Config<MenuPluginConfigParams<TMenu, TMenuItem>>) {
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

    modifyMenuItemProperties(
        params: MenuPluginConfigParams<TMenu, TMenuItem>
    ): void | Promise<void> {
        return this._execute("modifyMenuItemProperties", params);
    }

    private _execute(callback, params) {
        if (typeof this._config[callback] === "function") {
            return this._config[callback](params);
        }
    }
}
