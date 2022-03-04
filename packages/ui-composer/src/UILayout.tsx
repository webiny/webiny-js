import React from "react";
import { UIElement, UIElementConfig } from "./UIElement";
import { Plugin, plugins } from "@webiny/plugins";

interface LayoutItem {
    element: string;
    width: number;
}

interface UILayoutElementGetter {
    (elementId: string): UIElement<any>;
}

export interface UILayoutSorter<T extends UIElementConfig = UIElementConfig> {
    (elementA: UIElement<T>, elementB: UIElement<T>): number;
}

interface UILayoutRenderer {
    (params: { layout: UILayout; props: any; hasParentGrid: boolean }): React.ReactElement;
}

export class UILayout {
    private _renderer?: UILayoutRenderer;
    private _grid = true;
    private _layout: LayoutItem[][] = [];
    private readonly _getElement: UILayoutElementGetter;

    public constructor(elementGetter: UILayoutElementGetter) {
        this._getElement = elementGetter;

        const layoutPlugins = plugins.byType<UILayoutPlugin<any>>(UILayoutPlugin.type);
        layoutPlugins.forEach(plugin => plugin.apply(this));
    }

    public setGrid(flag: boolean) {
        this._grid = flag;
    }

    public getGrid() {
        return this._grid;
    }

    public getLayout() {
        return this._layout;
    }

    public setRenderer(renderer: UILayoutRenderer) {
        this._renderer = renderer;
    }

    public getElement(id: string): UIElement {
        return this._getElement(id);
    }

    public sort<T extends UIElementConfig = UIElementConfig>(sorter: UILayoutSorter<T>) {
        if (this._grid) {
            return;
        }

        this._layout = this._layout.sort((a, b) => {
            const elementA = this._getElement(a[0].element);
            const elementB = this._getElement(b[0].element);

            return sorter(elementA, elementB);
        });
    }

    public removeElement(element: UIElement<any>) {
        for (let i = 0; i < this._layout.length; i++) {
            const row = this._layout[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j].element === element.id) {
                    row.splice(j, 1);
                    // Update spans on all items
                    row.forEach(item => (item.width = 12 / row.length));
                    return;
                }
            }
        }
    }

    public insertElementAbove(lookFor: UIElement<any>, element: UIElement<any>) {
        for (let i = 0; i < this._layout.length; i++) {
            const row = this._layout[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j].element === lookFor.id) {
                    this._layout.splice(i, 0, [{ element: element.id, width: 12 }]);
                    return this;
                }
            }
        }
        return this;
    }

    public insertElementBelow(lookFor: UIElement<any>, element: UIElement<any>) {
        for (let i = 0; i < this._layout.length; i++) {
            const row = this._layout[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j].element === lookFor.id) {
                    this._layout.splice(i + 1, 0, [{ element: element.id, width: 12 }]);
                    return this;
                }
            }
        }
        return this;
    }

    public insertElementAfter(lookFor: UIElement<any>, element: UIElement<any>) {
        for (let i = 0; i < this._layout.length; i++) {
            const row = this._layout[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j].element === lookFor.id) {
                    const width = 12 / (row.length + 1);
                    row.splice(j + 1, 0, { element: element.id, width });
                    // Update spans on all items
                    row.forEach(item => (item.width = width));
                    return this;
                }
            }
        }
        console.log(`[WARNING] Could not locate element "${lookFor.id}" in the layout!`);
        return this;
    }

    public insertElementBefore(lookFor: UIElement<any>, element: UIElement<any>) {
        for (let i = 0; i < this._layout.length; i++) {
            const row = this._layout[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j].element === lookFor.id) {
                    const width = 12 / (row.length + 1);
                    // Insert new element to the left
                    row.splice(j, 0, { element: element.id, width });
                    // Update spans on all items
                    row.forEach(item => (item.width = width));
                    return this;
                }
            }
        }
        return this;
    }

    public insertElementAtTheBeginning(element: UIElement<any>) {
        this._layout.unshift([{ element: element.id, width: 12 }]);
        return this;
    }

    public insertElementAtTheEnd(element: UIElement<any>) {
        this._layout.push([{ element: element.id, width: 12 }]);
        return this;
    }

    public render(props: Record<string, any>, hasParentGrid = false) {
        if (!this._renderer) {
            throw Error(
                `UILayout needs a renderer! Register a UILayoutPlugin to configure a renderer.`
            );
        }

        return this._renderer({ layout: this, props, hasParentGrid });
    }
}

interface ApplyFunction<TElement> {
    (element: TElement): void;
}

export class UILayoutPlugin<TLayout extends UILayout = UILayout> extends Plugin {
    public static override readonly type: string = "UILayoutPlugin";
    private readonly _apply: ApplyFunction<TLayout>;

    constructor(apply: ApplyFunction<TLayout>) {
        super();

        this._apply = apply;
    }

    public apply(element: TLayout) {
        this._apply(element);
    }
}
