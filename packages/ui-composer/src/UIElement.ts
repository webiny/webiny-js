import React from "react";
import pWaitFor from "p-wait-for";
import { Plugin, plugins } from "@webiny/plugins";
import { UILayout } from "./UILayout";
import { UIView } from "./UIView";
import { UIRenderer } from "./UIRenderer";

type Class<T> = new (...args: any[]) => T;

export interface ShouldRender<TProps = any> {
    (params: { props: TProps; next: () => any }): boolean;
}

export interface UIElementConfig<TProps = any> {
    shouldRender?: ShouldRender<TProps>;
    tags?: string[];
}

function defaultShouldRender() {
    return true;
}

export interface UiElementRenderProps {
    [key: string]: any;
}

export class UIElement<TConfig extends UIElementConfig = UIElementConfig> {
    protected _elements = new Map<string, UIElement>();
    protected _layout: UILayout;
    private readonly _config: TConfig;
    private readonly _tags: Set<string> = new Set();
    private readonly _id: string;
    private _parent?: UIElement;
    private _renderers: UIRenderer<any>[] = [];
    private _shouldRender: ShouldRender[] = [defaultShouldRender];

    public constructor(id: string, config?: TConfig) {
        this._id = id;
        this._config = config || ({} as TConfig);
        /**
         * TODO @pavel verify that casting as UIElement is correct. Try to remove and see what happens.
         */
        this._layout = new UILayout(elementId => this.getElement(elementId) as UIElement);

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

    public isGridEnabled(): boolean {
        return this._layout.getGrid();
    }

    get config(): TConfig {
        return this._config;
    }

    get depth(): number {
        let depth = 0;

        let parent = this.getParent();
        while (parent && !(parent instanceof UIView)) {
            depth++;
            parent = parent.getParent();
        }

        return depth;
    }

    get hasParentGrid(): boolean {
        let parent = this.getParent();
        while (parent && !(parent instanceof UIView)) {
            if (parent.isGridEnabled()) {
                return true;
            }
            parent = parent.getParent();
        }

        return false;
    }

    public applyPlugins(elementClass: Class<UIElement>): void {
        const type = `UIElementPlugin.${elementClass.prototype.constructor.name}`;
        const elPlugins = plugins.byType<UIElementPlugin<any>>(type);
        elPlugins
            .filter(plugin => plugin.canHandle(elementClass))
            .forEach(plugin => plugin.apply(this));
    }

    public addRenderer(renderer: UIRenderer<any>): void {
        this._renderers.push(renderer);
    }

    public addShouldRender<TProps>(cb: ShouldRender<TProps>): void {
        this._shouldRender.push(cb);
    }

    public setLayout(layout: UILayout): void {
        this._layout = layout;
    }

    public getLayout(): UILayout {
        return this._layout;
    }

    public setParent(parent: UIElement): void {
        this._parent = parent;
    }

    public getParent(): UIElement {
        return this._parent as UIElement;
    }

    public getParentByType<TParent extends UIElement = UIElement>(type: Class<TParent>): TParent {
        let parent = this.getParent();
        while (parent) {
            if (parent instanceof type) {
                break;
            }

            parent = parent.getParent();
        }

        return parent as TParent;
    }

    public getDescendentsByTag(tag: string): UIElement[] {
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

    public getDescendentsByType<TElement extends UIElement = UIElement>(
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

    public addTag(tag: string): void {
        this._tags.add(tag);
    }

    public hasTag(tag: string): boolean {
        return this._tags.has(tag);
    }

    public removeTag(tag: string): void {
        this._tags.delete(tag);
    }

    public getView<TView extends UIView = UIView>(type: Class<UIView> = UIView): TView {
        let parent = this.getParent();
        while (parent && !(parent instanceof type)) {
            parent = parent.getParent();
        }

        return parent as TView;
    }

    public addElement<TElement extends UIElement = UIElement>(element: TElement): TElement {
        element.setParent(this);

        // We only need to modify layout if we're adding a new element
        if (!this._elements.has(element.id)) {
            this._layout.insertElementAtTheEnd(element);
        }

        this._elements.set(element.id, element);

        return element;
    }

    public useGrid(flag: boolean): void {
        this._layout.setGrid(flag);
    }

    public getElement<T extends UIElement = UIElement>(id: string): T | null {
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

    public getChildren(): UIElement[] {
        return Array.from(this._elements.values());
    }

    public moveInto(targetElement: UIElement): void {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.addElement(this);
    }

    public moveAfter(targetElement: UIElement): void {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementAfter(targetElement, this);
    }

    public moveBefore(targetElement: UIElement): void {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementBefore(targetElement, this);
    }

    public moveAbove(targetElement: UIElement): void {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementAbove(targetElement, this);
    }

    public moveBelow(targetElement: UIElement): void {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.getParent().insertElementBelow(targetElement, this);
    }

    public moveToTheBeginningOf(targetElement: UIElement): void {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.insertElementAtTheBeginning(this);
    }

    public moveToTheEndOf(targetElement: UIElement): void {
        const parent = this.getParent();
        if (parent) {
            parent.remove(this);
        }
        targetElement.insertElementAtTheEnd(this);
    }

    public remove(element?: UIElement<any>): void {
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

    async isRendered(): Promise<void> {
        return pWaitFor(() => this.getView() !== undefined, { interval: 50 });
    }

    public render(props?: UiElementRenderProps): React.ReactNode {
        if (!props) {
            props = {};
        }
        const layoutRenderer = (layoutRendererProps: Record<string, any>) => {
            return this._layout.render(layoutRendererProps, this.hasParentGrid);
        };

        const renderers: UIRenderer<any>[] = [...this._renderers].filter(pl =>
            pl.canRender(this, props)
        );

        const next = (nextProps: Record<string, any>): React.ReactNode => {
            if (renderers.length > 0) {
                const renderer = renderers.pop();
                if (!renderer) {
                    return layoutRenderer(nextProps);
                }
                return renderer.render({
                    element: this,
                    props: nextProps,
                    next: () => next(nextProps),
                    children: () => layoutRenderer(nextProps)
                });
            }
            return layoutRenderer(nextProps);
        };

        return next(props);
    }

    public replaceWith(element: UIElement): void {
        if (element.id === this.id) {
            this.getParent().addElement(element);
            return;
        }

        element.moveAfter(this);
        this.remove();
    }

    public shouldRender(props: Record<string, any>): boolean {
        const shouldRender = [...this._shouldRender];
        const next = (nextProps: Record<string, any>): any => {
            const shouldRenderCallable = shouldRender.pop();
            if (!shouldRenderCallable) {
                return false;
            }
            return shouldRenderCallable({
                props: nextProps,
                next: () => next(nextProps)
            });
        };

        return next(props);
    }

    protected insertElementAbove(lookFor: UIElement<any>, element: UIElement<any>): UIElement {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAbove(lookFor, element);
        return this;
    }

    protected insertElementBelow(lookFor: UIElement<any>, element: UIElement<any>): UIElement {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementBelow(lookFor, element);
        return this;
    }

    protected insertElementAfter(lookFor: UIElement<any>, element: UIElement<any>): UIElement {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAfter(lookFor, element);
        return this;
    }

    protected insertElementBefore(lookFor: UIElement<any>, element: UIElement<any>): UIElement {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementBefore(lookFor, element);
        return this;
    }

    protected insertElementAtTheBeginning(element: UIElement<any>): UIElement {
        element.setParent(this);
        this._elements.set(element.id, element);
        this._layout.insertElementAtTheBeginning(element);
        return this;
    }

    protected insertElementAtTheEnd(element: UIElement<any>): UIElement {
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
    public static override readonly type: string = "UIElementPlugin";
    private readonly _apply: ApplyFunction<TElement>;
    private readonly _elementClass: Class<TElement>;

    public constructor(elementClass: Class<TElement>, apply: ApplyFunction<TElement>) {
        super();

        this._elementClass = elementClass;
        this._apply = apply;
    }

    override get type(): string {
        return `UIElementPlugin.${this._elementClass.prototype.constructor.name}`;
    }

    public canHandle(elementClass: Class<UIElement>): boolean {
        /**
         * We need to compare exact classes because we only want to run plugins for an exact class
         * and not the entire inheritance tree.
         */
        return elementClass === this._elementClass;
    }

    public apply(element: TElement): void {
        this._apply(element);
    }
}
