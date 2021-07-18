import React from "react";
import { Element } from "~/views/Users/elements/Element";

interface Renderer<TProps> {
    (props: TProps): React.ReactNode;
}

export class GenericElement<TRenderProps> extends Element {
    private _render: Renderer<TRenderProps>;

    constructor(id, render: Renderer<TRenderProps>) {
        super(id);

        this._render = render;
    }
    render(props: TRenderProps) {
        return this._render(props);
    }
}
