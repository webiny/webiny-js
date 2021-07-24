import React from "react";
import { default as localStorage } from "store";
import { plugins } from "@webiny/plugins";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";
import { NavigationMenuElementPlugin } from "~/plugins/NavigationMenuElementPlugin";

interface NavigationMenuElementConfig extends ElementConfig {
    label: string;
    icon?: React.ReactElement;
    path?: string;
    onClick?: Function;
    testId?: string;
    rel?: string;
}

const LOCAL_STORAGE_KEY = "webiny_apps_menu_sections";

export class NavigationMenuElement extends Element<NavigationMenuElementConfig> {
    private _isExpanded = false;

    constructor(id, config: NavigationMenuElementConfig) {
        super(id, config);

        this.toggleGrid(false);

        const state = this.loadState();
        this._isExpanded = state.includes(this.id);

        // Apply plugins
        plugins
            .byType<NavigationMenuElementPlugin>(NavigationMenuElementPlugin.type)
            .forEach(plugin => plugin.apply(this));
    }
    
    get isExpanded() {
        return this._isExpanded;
    }

    setIcon(icon: React.ReactElement) {
        this.config.icon = icon;
    }

    setLabel(label: string) {
        this.config.label = label;
    }

    setPath(path: string) {
        this.config.path = path;
    }

    expandElement() {
        this._isExpanded = true;
        const state = this.loadState();
        if (!state.includes(this.id)) {
            state.push(this.id);
        }
        this.storeState(state);
        this.getView().refresh();
    }

    collapseElement() {
        this._isExpanded = false;
        const state = this.loadState();
        if (state.includes(this.id)) {
            state.splice(state.indexOf(this.id), 1);
        }
        this.storeState(state);
        this.getView().refresh();
    }

    toggleElement() {
        if (this._isExpanded) {
            this.collapseElement();
        } else {
            this.expandElement();
        }
    }

    private loadState() {
        return localStorage
            .get(LOCAL_STORAGE_KEY)
            .split(",")
            .filter(Boolean);
    }

    private storeState(state) {
        localStorage.set(LOCAL_STORAGE_KEY, state.join(","));
    }
}
