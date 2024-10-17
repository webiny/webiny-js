import React, { useCallback, useState } from "react";
import pWaitFor from "p-wait-for";
import { Plugin, plugins } from "@webiny/plugins";
import { UIElement, UIElementConfig } from "./UIElement";

interface UIViewIDProps {
    children: React.ReactNode;
}

const UIViewID = ({ children }: UIViewIDProps) => {
    return <>{children}</>;
};

export interface UIElementWrapperProps {
    children: React.ReactNode;
    [key: string]: any;
}

export interface UIElementWrapper {
    (props: UIElementWrapperProps): React.ReactElement;
}

export interface UIViewProps {
    render: () => void;
    [key: string]: any;
}

export class UIView<TConfig extends UIElementConfig = UIElementConfig> extends UIElement<TConfig> {
    private _events = new Map();
    private _hookDefinitions: Record<string, () => any> = {};
    private _hookValues: Record<string, any> = {};
    private _props?: UIViewProps;
    private _isRendered = false;
    private _wrappers: UIElementWrapper[] = [];

    public constructor(id: string, config?: TConfig) {
        super(id, config);

        this.useGrid(false);
    }

    get props(): UIViewProps | undefined {
        return this._props;
    }

    set props(value) {
        this._props = value;
    }

    public addHookDefinition<T = any>(key: string, hook: () => T): void {
        this._hookDefinitions[key] = hook;
    }

    public override applyPlugins(viewClass: Class<UIView>): void {
        const type = `UIViewPlugin.${viewClass.prototype.constructor.name}`;
        const elPlugins = plugins.byType<UIViewPlugin<any>>(type);
        elPlugins
            .filter(plugin => plugin.canHandle(viewClass))
            .forEach(plugin => plugin.apply(this));
    }

    public async awaitElement<TElement extends UIElement = UIElement<any>>(
        id: string
    ): Promise<TElement> {
        await pWaitFor(() => this.getElement<TElement>(id) !== undefined);
        /**
         * TODO @pavel check if casting is ok
         */
        return this.getElement<TElement>(id) as TElement;
    }

    public getHookDefinitions<T>(): Record<string, () => T> {
        return this._hookDefinitions;
    }

    public setHookValues(values: Record<string, any>): void {
        this._hookValues = values;
    }

    public getHook<THook = any>(key: string): THook {
        return this._hookValues[key];
    }

    public getWrappers(): UIElementWrapper[] {
        return this._wrappers;
    }

    public wrapWith(wrapper: UIElementWrapper): void {
        // TODO: see if we want to wrap with an instance of an Element, or is a React component enough.
        this._wrappers.push(wrapper);
    }

    public dispatchEvent(name: string, params: Record<string, any> = {}): void {
        const callbacks: CallableFunction[] = Array.from(this._events.get(name) || new Set());
        callbacks.reverse().reduce((data, cb) => cb(data), params);
    }

    public addEventListener(event: string, cb: CallableFunction): void {
        const callbacks = this._events.get(event) || new Set();
        callbacks.add(cb);
        this._events.set(event, callbacks);
    }

    public override async isRendered() {
        return pWaitFor(() => this._isRendered, { interval: 50 });
    }

    public override render(props?: UIViewProps): React.ReactNode {
        // We want to keep track of props that triggered the render cycle.
        this._props = props;

        // Mark view as rendered
        this._isRendered = true;

        return <UIViewID key={this.id}>{super.render(props)}</UIViewID>;
    }

    public refresh(): void {
        if (!this._props || typeof this._props.render !== "function") {
            return;
        }
        this._props.render();
    }
}

export interface ApplyFunction<TView> {
    (view: TView): void;
}

type Class<T> = new (...args: any[]) => T;

export class UIViewPlugin<TView extends UIView> extends Plugin {
    public static override readonly type: string = "UIViewPlugin";
    private readonly _apply: ApplyFunction<TView>;
    private readonly _viewClass: Class<TView>;

    public constructor(viewClass: Class<TView>, apply: ApplyFunction<TView>) {
        super();

        this._apply = apply;
        this._viewClass = viewClass;
    }

    override get type(): string {
        return `UIViewPlugin.${this._viewClass.prototype.constructor.name}`;
    }

    public canHandle(viewClass: Class<UIView>): boolean {
        return viewClass === this._viewClass;
    }

    public apply(view: TView): void {
        this._apply(view);
    }
}

interface UIViewComponentProps {
    view: UIView;
    [key: string]: any;
}

interface UIViewHooksProps {
    view: UIView;
    props: Record<string, any>;
    render: any;
}

const UIViewHooks = ({ view, props, render }: UIViewHooksProps) => {
    const hooks = view.getHookDefinitions();
    if (hooks) {
        view.setHookValues(
            Object.keys(hooks).reduce((acc, key) => ({ ...acc, [key]: hooks[key]() }), {})
        );
    }

    return <>{view.render({ ...props, render })}</>;
};

export const UIViewComponent = ({ view, ...props }: UIViewComponentProps): React.ReactElement => {
    const [, setCount] = useState<number>(0);

    const wrappers = view.getWrappers();

    const render = useCallback(() => {
        setCount(count => count + 1);
    }, []);

    return wrappers.reduce((el, wrapper) => {
        return wrapper({ ...props, children: el });
    }, <UIViewHooks view={view} render={render} props={props} />);
};
