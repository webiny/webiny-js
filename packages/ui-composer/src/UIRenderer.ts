import React from "react";
export interface UIRenderParams<TElement, TProps = any> {
    element: TElement;
    props: TProps;
    next: RenderNext;
    children: RenderChildren;
}

export interface RenderNext {
    (): React.ReactNode;
}

export interface RenderChildren {
    (): React.ReactNode;
}

export abstract class UIRenderer<TElement, TProps = any> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public canRender(_: TElement, __: TProps) {
        return true;
    }

    abstract render(params: UIRenderParams<TElement, TProps>): React.ReactNode;
}
