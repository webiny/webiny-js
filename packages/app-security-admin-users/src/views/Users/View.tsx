import React from "react";
import { Plugin } from "@webiny/plugins";
import { UsersFormView } from "~/views/Users/UsersFormView";
import { LayoutElement } from "~/views/Users/elements/LayoutElement";

export class View extends LayoutElement {
    private _events = new Map();

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
        return super.render(props, 0);
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
