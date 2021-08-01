export interface ElementRenderParams<TElement, TProps = any> {
    element: TElement;
    props: TProps;
    next: RenderNext;
}

export interface RenderNext {
    (props?: any): React.ReactNode;
}

export abstract class ElementRenderer<TElement, TProps = any> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canRender(element: TElement, props: TProps) {
        return true;
    }

    abstract render(params: ElementRenderParams<TElement, TProps>): React.ReactNode;
}
