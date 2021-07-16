import React from "react";
import { ViewLayout } from "~/views/Users/ViewLayout";
import { Element } from "./Element";

export abstract class LayoutElement<T = Record<string, any>> extends Element<T> {
    protected _elements = new Map();
    protected _layout = new ViewLayout();
    protected _wrappers = [];

    wrapWith(component: React.ReactComponentElement<any>) {
        this._wrappers.unshift(component);
    }

    disableGrid() {
        this._layout.setGrid(false);
    }

    addElement(element: Element<any>): Element<any> {
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheBottom(element);
        return element;
    }

    removeElement(element: Element<any>): void {
        this._elements.delete(element.id);
        this._layout.removeElement(element);
    }

    getElement<T extends Element<any> = Element<any>>(id: string): T {
        return this._elements.get(id);
    }

    insertElementAbove(lookFor: Element<any>, element: Element<any>) {
        this._elements.set(element.id, element);
        this._layout.insertElementAbove(lookFor, element);
        return this;
    }

    insertElementBelow(lookFor: Element<any>, element: Element<any>) {
        this._elements.set(element.id, element);
        this._layout.insertElementBelow(lookFor, element);
        return this;
    }

    insertElementToTheRightOf(lookFor: Element<any>, element: Element<any>) {
        this._elements.set(element.id, element);
        this._layout.insertElementToTheRightOf(lookFor, element);
        return this;
    }

    insertElementToTheLeftOf(lookFor: Element<any>, element: Element<any>) {
        this._elements.set(element.id, element);
        this._layout.insertElementToTheLeftOf(lookFor, element);
        return this;
    }

    insertElementAtTheBottom(element: Element<any>) {
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheBottom(element);
        return this;
    }

    render(props: any) {
        const content = this._layout.render(props, (elementId: string) =>
            this.getElement(elementId)
        );
        
        return this._wrappers.reduce((el, Component) => {
            return React.createElement(Component, {}, el);
        }, content);
    }
}
