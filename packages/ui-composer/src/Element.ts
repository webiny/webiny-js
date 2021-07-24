import React from "react";
import { ViewLayout } from "./ViewLayout";
import { View } from "./View";
import { Plugin } from "@webiny/plugins";

export interface ElementConfig<TProps = any> {
    shouldRender?(props: TProps): boolean;
}

export interface ElementRenderer {
    (params: { props: any; superRender: (props: any) => React.ReactNode }): React.ReactNode;
}

export abstract class Element<TConfig extends ElementConfig = ElementConfig> {
    private _config: TConfig;
    private _elements = new Map();
    private _layout: ViewLayout;
    private _wrappers = [];
    private _id: string;
    private _parent: Element;
    private _renderer: ElementRenderer;

    constructor(id: string, config?: TConfig) {
        this._id = id;
        this._config = config || ({} as TConfig);
        this._layout = new ViewLayout(elementId => this.getElement(elementId));
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

    protected getRenderer() {
        if (!this._renderer) {
            return null;
            // throw new Error(`Element ${this.constructor.name} is missing a renderer!`);
        }
        return this._renderer;
    }

    setRenderer(renderer: ElementRenderer) {
        this._renderer = renderer;
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

    getView(): View {
        let parent = this.getParent();
        while (parent && !(parent instanceof View)) {
            parent = parent.getParent();
        }

        return parent as View;
    }

    addElement(element: Element): Element {
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
        const superRender = props => {
            const content = this._layout.render(props, this.depth);

            return this._wrappers.reduce((el, Component) => {
                return React.createElement(Component, {}, el);
            }, content);
        };

        const renderer = this.getRenderer();
        if (!renderer) {
            return superRender(props);
        }

        return renderer({ props, superRender });
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
