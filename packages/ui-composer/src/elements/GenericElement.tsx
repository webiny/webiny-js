import React from "react";
import { UIElement, UiElementRenderProps } from "~/UIElement";

interface Renderer<TRenderProps> {
    (props: TRenderProps): React.ReactNode;
}

export class GenericElement<
    TRenderProps extends UiElementRenderProps = UiElementRenderProps
> extends UIElement {
    private readonly _render?: Renderer<TRenderProps>;

    constructor(id: string, render?: Renderer<TRenderProps>) {
        super(id);
        this.useGrid(false);

        this._render = render;
    }
    public override render(props: TRenderProps): React.ReactNode {
        return typeof this._render === "function" ? this._render(props) : super.render(props);
    }
}
