import React from "react";
import pWaitFor from "p-wait-for";
import { Plugin, plugins } from "@webiny/plugins";
import { Layout } from "./Layout";
import { View } from "./View";
import { ElementRenderer } from "./ElementRenderer";

type Class<T> = new (...args: any[]) => T;

export interface ShouldRender<TProps = any> {
    (params: { props: TProps; next: Function }): boolean;
}

export interface ElementConfig<TProps = any> {
    shouldRender?: ShouldRender<TProps>;
    tags?: string[];
}

interface ElementWrapperProps {
    children: React.ReactNode;
    [key: string]: any;
}

export interface ElementWrapper {
    (props: ElementWrapperProps): React.ReactElement;
}

function defaultShouldRender() {
    return true;
}

export abstract class Element<TConfig extends ElementConfig = ElementConfig> {
    protected _elements = new Map<string, Element>();
    private _config: TConfig;
    private _tags = new Set();
    private _layout: Layout;
    private _wrappers: ElementWrapper[] = [];
    private _id: string;
    private _parent: Element;
    private _renderers: ElementRenderer<any>[] = [];
    private _shouldRender: ShouldRender[] = [defaultShouldRender];

    constructor(id: string, config?: TConfig) {
        this._id = id;
        this._config = config || ({} as TConfig);
        this._layout = new Layout(elementId => this.getElement(elementId));

        if (!config) {
            return;
        }

        if (config.tags) {
            this._tags = new Set(config.tags);
        }

        if (config.shouldRender) {
            this._shouldRender.push(config.shouldRender);
        }
    }

    get id() {
        return this._id;
    }

    isGridEnabled() {
        return this._layout.getGrid();
    }

    get config(): TConfig {
        return this._config;
    }

    get depth() {
        let depth = 0;

        let parent = this.getParent();
        while (parent && !(parent instanceof View)) {
            depth++;
            parent = parent.getParent();
        }

        return depth;
    }

    get hasParentGrid() {
        let parent = this.getParent();
        while (parent && !(parent instanceof View)) {
            if (parent.isGridEnabled()) {
                return true;
            }
            parent = parent.getParent();
        }

        return false;
    }

    applyPlugins(elementClass: Class<Element>) {
        const type = `ElementPlugin.${elementClass.prototype.constructor.name}`;
        const elPlugins = plugins.byType<ElementPlugin<any>>(type);
        elPlugins
            .filter(plugin => plugin.canHandle(elementClass))
            .forEach(plugin => plugin.apply(this));
    }

    addRenderer(renderer: ElementRenderer<any>) {
        this._renderers.push(renderer);
    }

    addShouldRender<TProps>(cb: ShouldRender<TProps>) {
        this._shouldRender.push(cb);
    }

    getLayout() {
        return this._layout;
    }

    setParent(parent: Element) {
        this._parent = parent;
    }

    getParent(): Element {
        return this._parent;
    }

    getParentOfType<TParent extends Element = Element>(type: any): TParent {
        let parent = this.getParent();
        while (parent) {
            if (parent instanceof type) {
                break;
            }

            parent = parent.getParent();
        }

        return parent as TParent;
    }

    addTag(tag: string) {
        this._tags.add(tag);
    }

    hasTag(tag: string) {
        return this._tags.has(tag);
    }

    removeTag(tag: string) {
        this._tags.delete(tag);
    }

    getView<TView extends View = View>(type: Class<View> = View): TView {
        let parent = this.getParent();
        while (parent && !(parent instanceof type)) {
            parent = parent.getParent();
        }

        return parent as TView;
    }

    addElement<TElement extends Element = Element>(element: TElement): TElement {
        element.setParent(this);

        // We only need to modify layout if we're adding a new element
        if (!this._elements.has(element.id)) {
            this._layout.insertElementAtTheEnd(element);
        }

        this._elements.set(element.id, element);

        return element;
    }

    useGrid(flag: boolean) {
        this._layout.setGrid(flag);
    }

    getElement<T extends Element = Element>(id: string): T {
        const ownElement = this._elements.get(id);
        if (ownElement) {
            return ownElement as T;
        }

        // Search child elements recursively until an element is found
        const elements = this._elements.values();
        for (const element of elements) {
            if (element instanceof Element) {
                const descendant = element.getElement<T>(id);
                if (descendant) {
                    return descendant;
                }
            }
        }

        return null;
    }

    getElements(): Element[] {
        return Array.from(this._elements.values());
    }

    getElementsByTag(tag: string): Element[] {
        const elements = Array.from(this._elements.values());

        // Search child elements recursively
        for (const element of elements) {
            if (element instanceof Element) {
                const descendants = element.getElements();
                for (const descendant of descendants) {
                    descendant.getElementsByTag(tag).forEach(el => elements.push(el));
                }
            }
        }
        return elements.filter(el => el.hasTag(tag));
    }

    moveTo(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.addElement(this);
    }

    moveAfter(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementAfter(targetElement, this);
    }

    moveBefore(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementBefore(targetElement, this);
    }

    moveAbove(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementAbove(targetElement, this);
    }

    moveBelow(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementBelow(targetElement, this);
    }

    moveToTheBeginningOf(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.insertElementAtTheBeginning(this);
    }

    moveToTheEndOf(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.insertElementAtTheEnd(this);
    }

    remove(element?: Element<any>): void {
        if (!element) {
            // Delete self
            this.addTag("removed");
            this.getParent().remove(this);
            return;
        }

        element.addTag("removed");
        this._elements.delete(element.id);
        this._layout.removeElement(element);
    }

    async isRendered() {
        return pWaitFor(() => this.getView() !== undefined, { interval: 50 });
    }

    render(props?: any): React.ReactNode {
        const layoutRenderer = props => {
            const content = this._layout.render(props, this.depth, this.hasParentGrid);

            return this._wrappers.reduce((el, wrapper) => {
                return wrapper({ ...props, children: el });
            }, content);
        };

        const renderers: ElementRenderer<any>[] = [...this._renderers].filter(pl =>
            pl.canRender(this, props)
        );

        const next = (props: any) => {
            if (renderers.length > 0) {
                return renderers.pop().render({ element: this, props, next: () => next(props) });
            }
            return layoutRenderer(props);
        };

        return next(props);
    }

    replaceWith(element: Element) {
        if (element.id === this.id) {
            this.getParent().addElement(element);
            return;
        }

        element.moveAfter(this);
        this.remove();
    }

    shouldRender(props) {
        const shouldRender = [...this._shouldRender];
        const next = (props: any) => {
            return shouldRender.pop()({ props, next: () => next(props) });
        };

        return next(props);
    }

    wrapWith(wrapper: ElementWrapper) {
        // TODO: see if we want to wrap with an instance of an Element, or is a React component enough.
        this._wrappers.push(wrapper);
    }

    protected insertElementAbove(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAbove(lookFor, element);
        return this;
    }

    protected insertElementBelow(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementBelow(lookFor, element);
        return this;
    }

    protected insertElementAfter(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAfter(lookFor, element);
        return this;
    }

    protected insertElementBefore(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementBefore(lookFor, element);
        return this;
    }

    protected insertElementAtTheBeginning(element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheBeginning(element);
        return this;
    }

    protected insertElementAtTheEnd(element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheEnd(element);
        return this;
    }
}

interface ApplyFunction<TElement> {
    (element: TElement): void;
}

export class ElementPlugin<TElement extends Element> extends Plugin {
    public static readonly type: string = "ElementPlugin";
    private _apply: ApplyFunction<TElement>;
    private _elementClass: Class<TElement>;

    constructor(elementClass: Class<TElement>, apply: ApplyFunction<TElement>) {
        super();

        this._elementClass = elementClass;
        this._apply = apply;
    }

    get type() {
        return `ElementPlugin.${this._elementClass.prototype.constructor.name}`;
    }

    canHandle(elementClass: Class<Element>) {
        /**
         * We need to compare exact classes because we only want to run plugins for an exact class
         * and not the entire inheritance tree.
         */
        return elementClass === this._elementClass;
    }

    apply(element: TElement) {
        this._apply(element);
    }
}
