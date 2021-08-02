import React from "react";
import { UIElement } from "../UIElement";

interface Renderer<TRenderProps> {
    (props: TRenderProps): React.ReactNode;
}

export class GenericElement<TRenderProps = any> extends UIElement {
    private _render: Renderer<TRenderProps>;

    constructor(id, render?: Renderer<TRenderProps>) {
        super(id);
        this.useGrid(false);

        this._render = render;
    }
    render(props: TRenderProps) {
        return typeof this._render === "function" ? this._render(props) : super.render(props);
    }
}
