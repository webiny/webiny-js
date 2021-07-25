import React from "react";
import { Layout } from "./Layout";
import { View } from "./View";
import { Plugin } from "@webiny/plugins";
import { ElementRenderer } from "./ElementRenderer";

export interface ElementConfig<TProps = any> {
    shouldRender?(props: TProps): boolean;
}

export abstract class Element<TConfig extends ElementConfig = ElementConfig> {
    private _config: TConfig;
    private _elements = new Map();
    private _tags = new Set();
    private _layout: Layout;
    private _wrappers = [];
    private _id: string;
    private _parent: Element;
    private _renderers: ElementRenderer<any>[] = [];

    constructor(id: string, config?: TConfig) {
        this._id = id;
        this._config = config || ({} as TConfig);
        this._layout = new Layout(elementId => this.getElement(elementId));
    }

    get id() {
        return this._id;
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

    addRenderer(renderer: ElementRenderer<any>) {
        this._renderers.push(renderer);
    }

    setParent(parent: Element) {
        this._parent = parent;
    }

    getParent(): Element {
        return this._parent;
    }

    getParentOfType(type: any): Element {
        let parent = this.getParent();
        while (parent) {
            if (parent instanceof type) {
                break;
            }

            parent = parent.getParent();
        }

        return parent;
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

    getView<TView extends View = View>(): TView {
        let parent = this.getParent();
        while (parent && !(parent instanceof View)) {
            parent = parent.getParent();
        }

        return parent as TView;
    }

    addElement<TElement extends Element = Element>(element: TElement): TElement {
        element.setParent(this);

        // We only need to modify layout if we're adding a new element
        if (!this._elements.has(element.id)) {
            this._layout.insertElementAtTheBottom(element);
        }

        this._elements.set(element.id, element);

        return element;
    }

    toggleGrid(flag: boolean) {
        this._layout.setGrid(flag);
    }

    getElement<T extends Element>(id: string): T {
        const ownElement = this._elements.get(id);
        if (ownElement) {
            return ownElement;
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
            parent.removeElement(this);
        }
        targetElement.addElement(this);
    }

    moveAfter(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.getParent().insertElementAfter(targetElement, this);
    }

    moveBefore(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.getParent().insertElementBefore(targetElement, this);
    }

    moveAbove(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.getParent().insertElementAbove(targetElement, this);
    }

    moveBelow(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.getParent().insertElementBelow(targetElement, this);
    }

    moveToTheBeginningOf(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.insertElementAtTheBeginning(this);
    }

    moveToTheEndOf(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.insertElementAtTheEnd(this);
    }

    removeElement(element?: Element<any>): void {
        if (!element) {
            // Delete self
            this.getParent().removeElement(this);
            return;
        }

        this._elements.delete(element.id);
        this._layout.removeElement(element);
    }

    render(props?: any): React.ReactNode {
        const layoutRenderer = props => {
            const content = this._layout.render(props, this.depth);

            return this._wrappers.reduce((el, Component) => {
                return React.createElement(Component, {}, el);
            }, content);
        };

        const renderers: ElementRenderer<any>[] = [...this._renderers].filter(pl =>
            pl.canRender(this)
        );
        
        const next = (props: any) => {
            if (renderers.length > 0) {
                return renderers.pop().render({ element: this, props, next });
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
        this.removeElement();
    }

    shouldRender(props) {
        if (typeof this._config.shouldRender === "function") {
            return this._config.shouldRender(props);
        }
        return true;
    }

    wrapWith(component: React.ComponentType<any>) {
        // TODO: see if we want to wrap with an instance of an Element, or is a React component enough.
        this._wrappers.unshift(component);
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
        this._layout.insertElementToTheRightOf(lookFor, element);
        return this;
    }

    protected insertElementBefore(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementToTheLeftOf(lookFor, element);
        return this;
    }

    protected insertElementAtTheBeginning(element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheTop(element);
        return this;
    }

    protected insertElementAtTheEnd(element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheBottom(element);
        return this;
    }
}

interface ApplyFunction<TElement> {
    (element: TElement): void;
}

export class ElementPlugin<TElement> extends Plugin {
    public static readonly type: string;
    private _apply: ApplyFunction<TElement>;

    constructor(apply?: ApplyFunction<TElement>) {
        super();

        this._apply = apply;

        if (!this.type) {
            throw Error(`Missing "type" definition in "${this.constructor.name}"!`);
        }
    }

    apply(element: TElement) {
        if (!this._apply) {
            throw Error(
                `You must either pass an "apply" function to plugin constructor, or extend the plugin class and override the "apply" method.`
            );
        }

        this._apply(element);
    }
}
