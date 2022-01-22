import React from "react";
import pWaitFor from "p-wait-for";
import { Plugin, plugins } from "@webiny/plugins";
import { UILayout } from "./UILayout";
import { UIView } from "./UIView";
import { UIRenderer } from "./UIRenderer";

type Class<T> = new (...args: any[]) => T;

export interface ShouldRender<TProps = any> {
    (params: { props: TProps; next: Function }): boolean;
}

export interface UIElementConfig<TProps = any> {
    shouldRender?: ShouldRender<TProps>;
    tags?: string[];
}

function defaultShouldRender() {
    return true;
}

export class UIElement<TConfig extends UIElementConfig = UIElementConfig> {
    protected _elements = new Map<string, UIElement>();
    protected _layout: UILayout;
    private readonly _config: TConfig;
    private readonly _tags: Set<string>;
    private readonly _id: string;
    private _parent: UIElement;
    private _renderers: UIRenderer<any>[] = [];
    private _shouldRender: ShouldRender[] = [defaultShouldRender];

    constructor(id: string, config?: TConfig) {
        this._id = id;
        this._config = config || ({} as TConfig);
        this._layout = new UILayout(elementId => this.getElement(elementId));

        if (!config) {
            return;
        }

        if (config.tags) {
            this._tags = new Set(config.tags);
        }

        if (config.shouldRender) {
            this._shouldRender.push(config.shouldRender);
        }

        this.applyPlugins(UIElement);
    }

    get id(): string {
        return this._id;
    }

    isGridEnabled(): boolean {
        return this._layout.getGrid();
    }

    get config(): TConfig {
        return this._config;
    }

    get depth() {
        let depth = 0;

        let parent = this.getParent();
        while (parent && !(parent instanceof UIView)) {
            depth++;
            parent = parent.getParent();
        }

        return depth;
    }

    get hasParentGrid() {
        let parent = this.getParent();
        while (parent && !(parent instanceof UIView)) {
            if (parent.isGridEnabled()) {
                return true;
            }
            parent = parent.getParent();
        }

        return false;
    }

    applyPlugins(elementClass: Class<UIElement>) {
        const type = `UIElementPlugin.${elementClass.prototype.constructor.name}`;
        const elPlugins = plugins.byType<UIElementPlugin<any>>(type);
        elPlugins
            .filter(plugin => plugin.canHandle(elementClass))
            .forEach(plugin => plugin.apply(this));
    }

    addRenderer(renderer: UIRenderer<any>) {
        this._renderers.push(renderer);
    }

    addShouldRender<TProps>(cb: ShouldRender<TProps>) {
        this._shouldRender.push(cb);
    }

    setLayout(layout: UILayout) {
        this._layout = layout;
    }

    getLayout() {
        return this._layout;
    }

    setParent(parent: UIElement) {
        this._parent = parent;
    }

    getParent(): UIElement {
        return this._parent;
    }

    getParentByType<TParent extends UIElement = UIElement>(type: Class<TParent>): TParent {
        let parent = this.getParent();
        while (parent) {
            if (parent instanceof (type as any)) {
                break;
            }

            parent = parent.getParent();
        }

        return parent as TParent;
    }

    getDescendentsByTag(tag: string): UIElement[] {
        const elements = Array.from(this._elements.values());

        // Search child elements recursively
        for (const element of elements) {
            if (element instanceof UIElement) {
                const children = element.getChildren();
                for (const child of children) {
                    child.getDescendentsByTag(tag).forEach(el => elements.push(el));
                }
            }
        }
        return elements.filter(el => el.hasTag(tag));
    }

    getDescendentsByType<TElement extends UIElement = UIElement>(
        type: Class<TElement>
    ): TElement[] {
        const elements = Array.from(this._elements.values());

        // Search child elements recursively
        for (const element of elements) {
            const children = element.getChildren();
            for (const child of children) {
                child.getDescendentsByType(type).forEach(el => {
                    elements.push(el);
                });
            }
        }

        return elements.filter(el => el instanceof type) as TElement[];
    }

    addTag(tag: string) {
        this._tags.add(tag);
    }

    hasTag(tag: string) {
        return this._tags.has(tag);
    }

    removeTag(tag: string) {
        this._tags.delete(tag);
    }

    getView<TView extends UIView = UIView>(type: Class<UIView> = UIView): TView {
        let parent = this.getParent();
        while (parent && !(parent instanceof type)) {
            parent = parent.getParent();
        }

        return parent as TView;
    }

    addElement<TElement extends UIElement = UIElement>(element: TElement): TElement {
        element.setParent(this);

        // We only need to modify layout if we're adding a new element
        if (!this._elements.has(element.id)) {
            this._layout.insertElementAtTheEnd(element);
        }

        this._elements.set(element.id, element);

        return element;
    }

    useGrid(flag: boolean) {
        this._layout.setGrid(flag);
    }

    getElement<T extends UIElement = UIElement>(id: string): T {
        const ownElement = this._elements.get(id);
        if (ownElement) {
            return ownElement as T;
        }

        // Search child elements recursively until an element is found
        const elements = this._elements.values();
        for (const element of elements) {
            if (element instanceof UIElement) {
                const descendant = element.getElement<T>(id);
                if (descendant) {
                    return descendant;
                }
            }
        }

        return null;
    }

    getChildren(): UIElement[] {
        return Array.from(this._elements.values());
    }

    moveInto(targetElement: UIElement) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.addElement(this);
    }

    moveAfter(targetElement: UIElement) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementAfter(targetElement, this);
    }

    moveBefore(targetElement: UIElement) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementBefore(targetElement, this);
    }

    moveAbove(targetElement: UIElement) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementAbove(targetElement, this);
    }

    moveBelow(targetElement: UIElement) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementBelow(targetElement, this);
    }

    moveToTheBeginningOf(targetElement: UIElement) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.insertElementAtTheBeginning(this);
    }

    moveToTheEndOf(targetElement: UIElement) {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.insertElementAtTheEnd(this);
    }

    remove(element?: UIElement<any>): void {
        if (!element) {
            // Delete self
            this.addTag("removed");
            this.getParent().remove(this);
            return;
        }

        element.addTag("removed");
        this._elements.delete(element.id);
        this._layout.removeElement(element);
    }

    async isRendered() {
        return pWaitFor(() => this.getView() !== undefined, { interval: 50 });
    }

    render(props?: Record<string, any>): React.ReactNode {
        const layoutRenderer = (props: Record<string, any>) => {
            return this._layout.render(props, this.hasParentGrid);
        };

        const renderers: UIRenderer<any>[] = [...this._renderers].filter(pl =>
            pl.canRender(this, props)
        );

        const next = (props: Record<string, any>): React.ReactNode => {
            if (renderers.length > 0) {
                return renderers.pop().render({
                    element: this,
                    props,
                    next: () => next(props),
                    children: () => layoutRenderer(props)
                });
            }
            return layoutRenderer(props);
        };

        return next(props);
    }

    replaceWith(element: UIElement) {
        if (element.id === this.id) {
            this.getParent().addElement(element);
            return;
        }

        element.moveAfter(this);
        this.remove();
    }

    shouldRender(props: Record<string, any>) {
        const shouldRender = [...this._shouldRender];
        const next = (props: any) => {
            return shouldRender.pop()({ props, next: () => next(props) });
        };

        return next(props);
    }

    protected insertElementAbove(lookFor: UIElement<any>, element: UIElement<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAbove(lookFor, element);
        return this;
    }

    protected insertElementBelow(lookFor: UIElement<any>, element: UIElement<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementBelow(lookFor, element);
        return this;
    }

    protected insertElementAfter(lookFor: UIElement<any>, element: UIElement<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAfter(lookFor, element);
        return this;
    }

    protected insertElementBefore(lookFor: UIElement<any>, element: UIElement<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementBefore(lookFor, element);
        return this;
    }

    protected insertElementAtTheBeginning(element: UIElement<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheBeginning(element);
        return this;
    }

    protected insertElementAtTheEnd(element: UIElement<any>) {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheEnd(element);
        return this;
    }
}

export interface ApplyFunction<TElement> {
    (element: TElement): void;
}

export class UIElementPlugin<TElement extends UIElement> extends Plugin {
    public static readonly type: string = "UIElementPlugin";
    private readonly _apply: ApplyFunction<TElement>;
    private readonly _elementClass: Class<TElement>;

    constructor(elementClass: Class<TElement>, apply: ApplyFunction<TElement>) {
        super();

        this._elementClass = elementClass;
        this._apply = apply;
    }

    get type(): string {
        return `UIElementPlugin.${this._elementClass.prototype.constructor.name}`;
    }

    canHandle(elementClass: Class<UIElement>): boolean {
        /**
         * We need to compare exact classes because we only want to run plugins for an exact class
         * and not the entire inheritance tree.
         */
        return elementClass === this._elementClass;
    }

    apply(element: TElement): void {
        this._apply(element);
    }
}
