import React from "react";
import classNames from "classnames";
import { UIElement, UiElementRenderProps } from "~/ui/UIElement";
import { Cell } from "@webiny/ui/Grid";

export class SplitViewPanelElement extends UIElement<any> {
    private _width = 12;
    private _classNames: Set<string> = new Set();

    public setWidth(width: number): void {
        this._width = width;
    }

    public addClassName(className: string): void {
        this._classNames.add(className);
    }

    public removeClassName(className: string): void {
        this._classNames.delete(className);
    }

    public setContentElement(element: UIElement): void {
        // Remove previous content
        this.getChildren().forEach(el => el.remove());

        // Add new content
        this.addElement(element);
    }

    public override render(props: UiElementRenderProps): React.ReactNode {
        return (
            <Cell span={this._width} className={classNames(Array.from(this._classNames.values()))}>
                {super.render(props)}
            </Cell>
        );
    }
}
