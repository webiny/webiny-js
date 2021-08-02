import * as React from "react";
import { Plugin } from "@webiny/plugins";
import { ItemProps, MenuProps, SectionProps } from "~/ui/views/NavigationView/legacyMenu";

interface Props {
    Menu: React.ComponentType<MenuProps>;
    Section: React.ComponentType<SectionProps>;
    Item: React.ComponentType<ItemProps>;
}

interface Config {
    render(props: Props): React.ReactNode;
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
