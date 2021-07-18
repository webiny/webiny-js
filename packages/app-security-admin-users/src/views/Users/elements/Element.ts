import React from "react";
import { ViewLayout } from "~/views/Users/ViewLayout";

export interface ElementConfig {
    shouldRender?(props: any): boolean;
}

export abstract class Element<T extends ElementConfig = ElementConfig> {
    private _config: T;
    private _elements = new Map();
    private _layout;
    private _wrappers = [];
    private _id: string;
    private _parent: Element;

    constructor(id: string, config?: T) {
        this._id = id;
        this._config = config || ({} as T);
        this._layout = new ViewLayout(elementId => this.getElement(elementId));
    }

    get id() {
        return this._id;
    }

    get config(): T {
        return this._config;
    }

    setParent(parent: Element) {
        this._parent = parent;
    }

    getParent(): Element {
        return this._parent;
    }

    addElement(element: Element<any>): Element<any> {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheBottom(element);
        return element;
    }

    toggleGrid(flag: boolean) {
        this._layout.setGrid(flag);
    }

    getElement<T extends Element = Element>(id: string): T {
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

    moveToTheRightOf(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.getParent().insertElementToTheRightOf(targetElement, this);
    }

    moveToTheLeftOf(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.getParent().insertElementToTheLeftOf(targetElement, this);
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

    moveToTheTopOf(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.insertElementAtTheTop(this);
    }

    moveToTheBottomOf(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.insertElementAtTheBottom(this);
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

    render(props: any, depth?: number): React.ReactNode {
        const content = this._layout.render(
            props,
            (elementId: string) => this.getElement(elementId),
            typeof depth === "undefined" ? 0 : depth
        );

        return this._wrappers.reduce((el, Component) => {
            return React.createElement(Component, {}, el);
        }, content);
    }

    replaceWith(element: Element) {
        // TODO
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

    protected insertElementToTheRightOf(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementToTheRightOf(lookFor, element);
        return this;
    }

    protected insertElementToTheLeftOf(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementToTheLeftOf(lookFor, element);
        return this;
    }

    protected insertElementAtTheTop(element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheTop(element);
        return this;
    }

    protected insertElementAtTheBottom(element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheBottom(element);
        return this;
    }
}
