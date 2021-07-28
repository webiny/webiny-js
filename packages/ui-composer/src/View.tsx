import React, { useCallback, useState } from "react";
import pWaitFor from "p-wait-for";
import { Plugin } from "@webiny/plugins";
import { Element } from "./Element";

const ViewID = ({ children }) => {
    return children;
};

export abstract class View extends Element {
    private _events = new Map();
    private _hookDefinitions: Record<string, Function> = {};
    private _hookValues: Record<string, any> = {};
    private _props: { render: Function; [key: string]: any };
    private _isRendered = false;

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

    async awaitElement<TElement extends Element = Element<any>>(id: string): Promise<TElement> {
        await pWaitFor(() => this.getElement<TElement>(id) !== undefined);

        return this.getElement<TElement>(id);
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

    async isRendered() {
        return pWaitFor(() => this._isRendered, { interval: 50 });
    }

    render(props?: any): React.ReactNode {
        // We want to keep track of props that triggered the render cycle.
        this._props = props;

        // Mark view as rendered
        this._isRendered = true;

        return <ViewID key={this.id}>{super.render(props)}</ViewID>;
    }

    refresh() {
        if (this._props && typeof this._props.render === "function") {
            this._props.render();
        }
    }
}

export interface ApplyFunction<TView> {
    (view: TView): void;
}

export abstract class ViewPlugin<TView> extends Plugin {
    public static readonly type: string;
    private _apply: ApplyFunction<TView>;

    constructor(apply?: ApplyFunction<TView>) {
        super();

        this._apply = apply;

        if (!this.type) {
            throw Error(`Missing "type" definition in "${this.constructor.name}"!`);
        }
    }

    apply(view: TView) {
        if (!this._apply) {
            throw Error(
                `You must either pass an "apply" function to plugin constructor, or extend the plugin class and override the "apply" method.`
            );
        }

        this._apply(view);
    }
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
