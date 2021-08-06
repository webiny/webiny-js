import React from "react";
import { default as localStorage } from "store";
import { UIElement, UIElementConfig } from "~/ui/UIElement";

export interface NavigationMenuElementConfig extends UIElementConfig {
    label: React.ReactNode;
    icon?: React.ReactElement;
    path?: string;
    onClick?: Function;
    testId?: string;
    rel?: string;
}

const LOCAL_STORAGE_KEY = "webiny_apps_menu_sections";

export enum TAGS {
    UTILS = "utils",
    APP = "app"
}

export class NavigationMenuElement extends UIElement<NavigationMenuElementConfig> {
    private _isExpanded = false;
    private _sorters = [];

    constructor(id: string, config: NavigationMenuElementConfig) {
        super(id, config);

        this.useGrid(false);

        const state = this.loadState();
        this._isExpanded = state.includes(this.id);

        this.addSorter((a, b) => {
            if (a.hasTag(TAGS.APP) && b.hasTag(TAGS.UTILS)) {
                return -1;
            }

            if (a.hasTag(TAGS.UTILS) && b.hasTag(TAGS.APP)) {
                return 1;
            }

            return a.config.label.localeCompare(b.config.label);
        });

        // Apply plugins
        this.applyPlugins(NavigationMenuElement);
    }

    addElement<TElement extends UIElement = UIElement>(element: TElement): TElement {
        super.addElement(element);
        this.runSorters();
        return element;
    }

    addSorter(sorter: Function) {
        this._sorters.push(sorter);
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
        return (localStorage.get(LOCAL_STORAGE_KEY) || "").split(",").filter(Boolean);
    }

    private storeState(state) {
        localStorage.set(LOCAL_STORAGE_KEY, state.join(","));
    }

    private runSorters() {
        for (const sorter of this._sorters) {
            this.getLayout().sort(sorter);
        }
    }
}
