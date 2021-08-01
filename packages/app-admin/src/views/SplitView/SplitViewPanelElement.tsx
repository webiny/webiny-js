import React from "react";
import classNames from "classnames";
import { UIElement } from "@webiny/ui-composer/UIElement";
import { Cell } from "@webiny/ui/Grid";

export class SplitViewPanelElement extends UIElement<any> {
    private _width = 12;
    private _classNames = new Set();

    setWidth(width: number) {
        this._width = width;
    }

    addClassName(className: string) {
        this._classNames.add(className);
    }

    removeClassName(className: string) {
        this._classNames.delete(className);
    }

    setContentElement(element: UIElement) {
        // Remove previous content
        this.getElements().forEach(el => el.remove());

        // Add new content
        this.addElement(element);
    }

    render(props: any) {
        return (
            <Cell span={this._width} className={classNames(Array.from(this._classNames.values()))}>
                {super.render(props)}
            </Cell>
        );
    }
}
