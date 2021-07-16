import React, { Fragment } from "react";
import { Element } from "./elements/Element";
import { Cell, Grid } from "@webiny/ui/Grid";

interface LayoutItem {
    element: string;
    span: number;
}

export class ViewLayout {
    private _grid = true;
    private _layout: LayoutItem[][] = [];

    setGrid(flag: boolean) {
        this._grid = flag;
    }

    removeElement(element: Element<any>) {
        for (let i = 0; i < this._layout.length; i++) {
            const row = this._layout[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j].element === element.id) {
                    row.splice(j, 1);
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
                    this._layout.splice(i, 0, [{ element: element.id, span: 12 }]);
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
                    this._layout.splice(i + 1, 0, [{ element: element.id, span: 12 }]);
                    return this;
                }
            }
        }
        return this;
    }

    insertElementToTheRightOf(lookFor: Element<any>, element: Element<any>) {
        for (let i = 0; i < this._layout.length; i++) {
            const row = this._layout[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j].element === lookFor.id) {
                    const span = 12 / (row.length + 1);
                    row[j].span = span;
                    row.splice(j + 1, 0, { element: element.id, span });
                    return this;
                }
            }
        }
        console.log(`[WARNING] Could not locate element "${lookFor.id}" in the layout!`);
        return this;
    }

    insertElementToTheLeftOf(lookFor: Element<any>, element: Element<any>) {
        for (let i = 0; i < this._layout.length; i++) {
            const row = this._layout[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j].element === lookFor.id) {
                    const span = 12 / (row.length + 1);
                    row[j].span = span;
                    // Insert new element to the left
                    row.splice(j, 0, { element: element.id, span });
                    return this;
                }
            }
        }
        return this;
    }

    insertElementAtTheBottom(element: Element<any>) {
        this._layout.push([{ element: element.id, span: 12 }]);
        return this;
    }

    render(props: any, getElement: Function) {
        if (!this._grid) {
            return (
                <Fragment>
                    {this._layout.map((row, index) => (
                        <Fragment key={index}>
                            {row.map(item => {
                                const element = getElement(item.element);
                                if (!element.shouldRender(props)) {
                                    return null;
                                }
                                return React.cloneElement(element.render(props), {
                                    key: item.element
                                });
                            })}
                        </Fragment>
                    ))}
                </Fragment>
            );
        }

        return (
            <Grid>
                {this._layout.map((row, index) => (
                    <Fragment key={index}>
                        {row.map(item => {
                            const element = getElement(item.element);
                            if (!element.shouldRender(props)) {
                                return null;
                            }
                            return (
                                <Cell key={item.element} span={item.span}>
                                    {element.render(props)}
                                </Cell>
                            );
                        })}
                    </Fragment>
                ))}
            </Grid>
        );
    }
}
