import * as React from "react";
import { Plugin } from "@webiny/plugins";
import { Menu, Item, Section } from "./menu/Navigation/components";

interface Config {
    render(props: {
        Menu: typeof Menu;
        Section: typeof Section;
        Item: typeof Item;
    }): React.ReactNode;
    order?: number;
}

export class MenuPlugin extends Plugin {
    public static readonly type = "admin-menu";
    private _config: Partial<Config>;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    get order() {
        return this._config.order;
    }

    render(props): React.ReactNode {
        return this._config.render(props);
    }
}
