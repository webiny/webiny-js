import { Plugin } from "@webiny/plugins";
import { Element } from "./elements/Element";
import { ViewLayout } from "~/views/Users/ViewLayout";
import { UsersFormView } from "~/views/Users/UsersFormView";
import React from "react";

export class View {
    private _events = new Map();
    private _elements = new Map();
    private _layout = new ViewLayout();
    protected _wrappers = [];

    wrapWith(component: React.ComponentType) {
        this._wrappers.unshift(component);
    }

    disableGrid() {
        this._layout.setGrid(false);
    }

    resetElements() {
        this._elements = new Map();
    }

    resetLayout() {
        this._layout = new ViewLayout();
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

    getElement<T extends Element = Element>(id: string): T {
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

    dispatchEvent(name: string, params = {}) {
        const callbacks: CallableFunction[] = Array.from(this._events.get(name) || new Set());
        callbacks.reverse().reduce((data, cb) => cb(data), params);
    }

    addEventListener(event: string, cb: CallableFunction) {
        const callbacks = this._events.get(event) || new Set();
        callbacks.add(cb);
        this._events.set(event, callbacks);
    }

    render(props: any) {
        const content = this._layout.render(props, elementId => this.getElement(elementId));

        return this._wrappers.reduce((el, Component) => {
            return React.createElement(Component, {}, el);
        }, content);
    }
}

export abstract class ViewPlugin<T> extends Plugin {
    abstract apply(view: T): void;
}

interface ViewProps {
    view: UsersFormView;
    hook: Function;
}

export const ViewComponent = ({ view, hook }: ViewProps) => {
    const hookValue = hook();

    return view.render({ ...hookValue });
};
