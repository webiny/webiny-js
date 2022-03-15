import * as React from "react";
import { Plugin } from "@webiny/plugins";

export interface MenuProps {
    name: string;
    label: React.ReactNode;
    icon: React.ReactElement;
    children: React.ReactNode;
    onClick?: (toggleSection: () => void) => void;
}

export interface SectionProps {
    label: React.ReactNode;
    children: React.ReactNode;
    icon?: React.ReactElement;
}

export interface ItemProps {
    label: React.ReactNode;
    path: string;
    style?: React.CSSProperties;
    onClick?: () => any;
}

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
    public static override readonly type: string = "admin-menu";
    private readonly _config: Partial<Config>;

    public constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    get order() {
        return this._config.order;
    }

    public render(props: Props): React.ReactNode {
        if (!this._config.render) {
            return null;
        }
        return this._config.render(props);
    }
}
