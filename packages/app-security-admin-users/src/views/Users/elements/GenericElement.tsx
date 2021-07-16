import React from "react";
import { Element } from "~/views/Users/elements/Element";

interface Renderer {
    (props: any): React.ReactElement;
}

export class GenericElement extends Element {
    private _render: Renderer;

    constructor(id, render: Renderer) {
        super(id);

        this._render = render;
    }
    render(props) {
        return this._render(props);
    }
}
