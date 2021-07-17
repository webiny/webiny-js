import React from "react";
import { ViewLayout } from "~/views/Users/ViewLayout";
import { Element } from "./Element";

export abstract class LayoutElement<T = Record<string, any>> extends Element<T> {
    protected _elements = new Map();
    protected _layout = new ViewLayout();
    protected _wrappers = [];

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
            if (element instanceof LayoutElement) {
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

    insertElementAbove(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAbove(lookFor, element);
        return this;
    }

    insertElementBelow(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementBelow(lookFor, element);
        return this;
    }

    insertElementToTheRightOf(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementToTheRightOf(lookFor, element);
        return this;
    }

    insertElementToTheLeftOf(lookFor: Element<any>, element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementToTheLeftOf(lookFor, element);
        return this;
    }

    insertElementAtTheTop(element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheTop(element);
        return this;
    }

    insertElementAtTheBottom(element: Element<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheBottom(element);
        return this;
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

    render(props: any, depth = 0) {
        const content = this._layout.render(
            props,
            (elementId: string) => this.getElement(elementId),
            depth
        );

        return this._wrappers.reduce((el, Component) => {
            return React.createElement(Component, {}, el);
        }, content);
    }

    wrapWith(component: React.ReactComponentElement<any>) {
        // TODO: see if we want to wrap with an instance of an Element, or is a React component enough.
        this._wrappers.unshift(component);
    }
}
