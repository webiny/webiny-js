export interface ElementRenderParams<TElement> {
    element: TElement;
    props: any;
    next: RenderNext;
}

export interface RenderNext {
    (props?: any): React.ReactNode;
}

export abstract class ElementRenderer<TElement> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canRender(element: TElement) {
        return true;
    }

    abstract render(params: ElementRenderParams<TElement>): React.ReactNode;
}
