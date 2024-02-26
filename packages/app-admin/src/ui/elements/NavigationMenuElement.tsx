import React from "react";
import { default as localStorage } from "store";
import { UIElement, UIElementConfig } from "~/ui/UIElement";
import { UILayoutSorter } from "@webiny/ui-composer/UILayout";

export interface NavigationMenuElementConfig extends UIElementConfig {
    label: React.ReactNode;
    icon?: React.ReactElement;
    path?: string;
    onClick?: (value: any) => void;
    testId?: string;
    rel?: string;
    target?: string;
}

const LOCAL_STORAGE_KEY = "webiny_apps_menu_sections";

export enum TAGS {
    UTILS = "utils",
    APP = "app"
}

export class NavigationMenuElement<
    TConfig extends NavigationMenuElementConfig = NavigationMenuElementConfig
> extends UIElement<TConfig> {
    private _isExpanded = false;
    private _sorters: UILayoutSorter<NavigationMenuElementConfig>[] = [];

    public constructor(id: string, config: TConfig) {
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

            return (a.config.label as string).localeCompare(b.config.label as string);
        });

        // Apply plugins
        this.applyPlugins(NavigationMenuElement);
    }

    public override addElement<TElement extends UIElement = UIElement>(
        element: TElement
    ): TElement {
        super.addElement(element);
        this.runSorters();
        return element;
    }

    public addSorter(sorter: UILayoutSorter<NavigationMenuElementConfig>): void {
        this._sorters.push(sorter);
    }

    get isExpanded(): boolean {
        return this._isExpanded;
    }

    public setIcon(icon: React.ReactElement): void {
        this.config.icon = icon;
    }

    public setLabel(label: string): void {
        this.config.label = label;
    }

    public setPath(path: string): void {
        this.config.path = path;
    }

    public expandElement(): void {
        this._isExpanded = true;
        const state = this.loadState();
        if (!state.includes(this.id)) {
            state.push(this.id);
        }
        this.storeState(state);
        this.getView().refresh();
    }

    public collapseElement(): void {
        this._isExpanded = false;
        const state = this.loadState();
        if (state.includes(this.id)) {
            state.splice(state.indexOf(this.id), 1);
        }
        this.storeState(state);
        this.getView().refresh();
    }

    public toggleElement(): void {
        if (this._isExpanded) {
            this.collapseElement();
            return;
        }
        this.expandElement();
    }

    private loadState(): string[] {
        return (localStorage.get(LOCAL_STORAGE_KEY) || "").split(",").filter(Boolean);
    }

    private storeState(state: string[]): void {
        localStorage.set(LOCAL_STORAGE_KEY, state.join(","));
    }

    private runSorters(): void {
        for (const sorter of this._sorters) {
            this.getLayout().sort(sorter);
        }
    }
}
