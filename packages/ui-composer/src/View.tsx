import React, { useCallback, useState } from "react";
import { Plugin } from "@webiny/plugins";
import { Element } from "./Element";

export abstract class View extends Element {
    private _events = new Map();
    private _hookDefinitions: Record<string, Function> = {};
    private _hookValues: Record<string, any> = {};
    private _props: { render: Function; [key: string]: any };

    constructor(id) {
        super(id);

        this.toggleGrid(false);
    }

    get props() {
        return this._props;
    }

    set props(value) {
        this._props = value;
    }

    addHookDefinition(key: string, hook: Function) {
        this._hookDefinitions[key] = hook;
    }

    getHookDefinitions() {
        return this._hookDefinitions;
    }

    setHookValues(values: Record<string, any>) {
        this._hookValues = values;
    }

    getHook<THook = any>(key: string): THook {
        return this._hookValues[key];
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

    render(props?: any): React.ReactNode {
        // We want to keep track of props that triggered the render cycle.
        this._props = props;

        return super.render(props);
    }

    refresh() {
        if (this._props && typeof this._props.render === "function") {
            this._props.render();
        }
    }
}

export abstract class ViewPlugin<T> extends Plugin {
    abstract apply(view: T): void;
}

interface ViewComponentProps {
    view: View;
    [key: string]: any;
}

export const ViewComponent = ({ view, ...props }: ViewComponentProps): React.ReactElement => {
    const [, setCount] = useState(0);

    const render = useCallback(() => {
        setCount(count => count + 1);
    }, []);

    const hooks = view.getHookDefinitions();
    if (hooks) {
        view.setHookValues(
            Object.keys(hooks).reduce((acc, key) => ({ ...acc, [key]: hooks[key]() }), {})
        );
    }

    return <>{view.render({ ...props, render })}</>;
};
