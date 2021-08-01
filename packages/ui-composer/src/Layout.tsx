import React, { Fragment } from "react";
import { Cell, Grid, GridInner } from "@webiny/ui/Grid";
import { Element } from "./Element";

interface LayoutItem {
    element: string;
    width: number;
}

const ElementID = ({ children }) => {
    return children;
};

interface ElementGetter {
    (elementId: string): Element<any>;
}

interface Sorter {
    (elementA: Element, elementB: Element): number;
}

export class Layout {
    private _grid = true;
    private _layout: LayoutItem[][] = [];
    private _getElement: ElementGetter;

    constructor(elementGetter: ElementGetter) {
        this._getElement = elementGetter;
    }

    setGrid(flag: boolean) {
        this._grid = flag;
    }

    getGrid() {
        return this._grid;
    }

    sort(sorter: Sorter) {
        if (this._grid) {
            return;
        }

        this._layout = this._layout.sort((a, b) => {
            const elementA = this._getElement(a[0].element);
            const elementB = this._getElement(b[0].element);

            return sorter(elementA, elementB);
        });
    }

    removeElement(element: Element<any>) {
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

    insertElementAbove(lookFor: Element<any>, element: Element<any>) {
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

    insertElementBelow(lookFor: Element<any>, element: Element<any>) {
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

    insertElementAfter(lookFor: Element<any>, element: Element<any>) {
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

    insertElementBefore(lookFor: Element<any>, element: Element<any>) {
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

    insertElementAtTheBeginning(element: Element<any>) {
        this._layout.unshift([{ element: element.id, width: 12 }]);
        return this;
    }

    insertElementAtTheEnd(element: Element<any>) {
        this._layout.push([{ element: element.id, width: 12 }]);
        return this;
    }

    render(props, depth = 0, hasParentGrid = false) {
        if (!this._grid) {
            return (
                <Fragment>
                    {this._layout.map((row, index) => (
                        <Fragment key={index}>
                            {row.map(item => {
                                const element = this._getElement(item.element);

                                if (!element) {
                                    console.warn(`Element "${item.element}" was not found!`);
                                    return null;
                                }

                                if (!element.shouldRender(props)) {
                                    return null;
                                }

                                return (
                                    <ElementID key={item.element}>
                                        {element.render(props)}
                                    </ElementID>
                                );
                            })}
                        </Fragment>
                    ))}
                </Fragment>
            );
        }

        const GridComponent = hasParentGrid ? GridInner : Grid;

        return (
            <GridComponent>
                {this._layout.map((row, index) => (
                    <Fragment key={index}>
                        {row.map(item => {
                            const element = this._getElement(item.element);
                            if (!element.shouldRender(props)) {
                                return null;
                            }
                            return (
                                <Cell key={item.element} span={item.width}>
                                    <ElementID key={item.element}>
                                        {element.render(props)}
                                    </ElementID>
                                </Cell>
                            );
                        })}
                    </Fragment>
                ))}
            </GridComponent>
        );
    }
}
