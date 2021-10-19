import React, { useCallback, useState } from "react";
import pWaitFor from "p-wait-for";
import { Plugin, plugins } from "@webiny/plugins";
import { UIElement, UIElementConfig } from "./UIElement";

const UIViewID = ({ children }) => {
    return children;
};

export interface UIElementWrapperProps {
    children: React.ReactNode;
    [key: string]: any;
}

export interface UIElementWrapper {
    (props: UIElementWrapperProps): React.ReactElement;
}

export class UIView<TConfig = UIElementConfig> extends UIElement<TConfig> {
    private _events = new Map();
    private _hookDefinitions: Record<string, Function> = {};
    private _hookValues: Record<string, any> = {};
    private _props: { render: Function; [key: string]: any };
    private _isRendered = false;
    private _wrappers: UIElementWrapper[] = [];

    constructor(id, config?: TConfig) {
        super(id, config);

        this.useGrid(false);
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

    applyPlugins(viewClass: Class<UIView>) {
        const type = `UIViewPlugin.${viewClass.prototype.constructor.name}`;
        const elPlugins = plugins.byType<UIViewPlugin<any>>(type);
        elPlugins
            .filter(plugin => plugin.canHandle(viewClass))
            .forEach(plugin => plugin.apply(this));
    }

    async awaitElement<TElement extends UIElement = UIElement<any>>(id: string): Promise<TElement> {
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

    getWrappers() {
        return this._wrappers;
    }

    wrapWith(wrapper: UIElementWrapper) {
        // TODO: see if we want to wrap with an instance of an Element, or is a React component enough.
        this._wrappers.push(wrapper);
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

        return <UIViewID key={this.id}>{super.render(props)}</UIViewID>;
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

type Class<T> = new (...args: any[]) => T;

export class UIViewPlugin<TView extends any> extends Plugin {
    public static readonly type: string = "UIViewPlugin";
    private _apply: ApplyFunction<TView>;
    private _viewClass: Class<TView>;

    constructor(viewClass: Class<TView>, apply: ApplyFunction<TView>) {
        super();

        this._apply = apply;
        this._viewClass = viewClass;
    }

    get type() {
        return `UIViewPlugin.${this._viewClass.prototype.constructor.name}`;
    }

    canHandle(viewClass: Class<UIView>) {
        return viewClass === this._viewClass;
    }

    apply(view: TView) {
        this._apply(view);
    }
}

interface UIViewComponentProps {
    view: UIView;

    [key: string]: any;
}

const UIViewHooks = ({ view, props, render }) => {
    const hooks = view.getHookDefinitions();
    if (hooks) {
        view.setHookValues(
            Object.keys(hooks).reduce((acc, key) => ({ ...acc, [key]: hooks[key]() }), {})
        );
    }

    return view.render({ ...props, render });
};

export const UIViewComponent = ({ view, ...props }: UIViewComponentProps): React.ReactElement => {
    const [, setCount] = useState(0);

    const wrappers = view.getWrappers();

    const render = useCallback(() => {
        setCount(count => count + 1);
    }, []);

    return wrappers.reduce((el, wrapper) => {
        return wrapper({ ...props, children: el });
    }, <UIViewHooks view={view} render={render} props={props} />);
};
