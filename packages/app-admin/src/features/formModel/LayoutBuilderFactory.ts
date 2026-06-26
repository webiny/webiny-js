import type { Icon } from "~/components/IconPicker/types.js";
import type {
    IField,
    IFieldBuilder,
    ILayoutBuilder,
    ILayoutNodeBuilder,
    ILayoutNodeHandle,
    IPositionedLayoutNode,
    IRule,
    ITabBuilder,
    ITabDefinition,
    ITabDefinitionInput,
    ITabsBuilder,
    ITabsNode,
    IRowBuilder,
    ISeparatorBuilder,
    IAlertBuilder,
    IElementBuilder,
    IObjectBuilder,
    IRowNode,
    ISeparatorNode,
    IAlertNode,
    IElementNode,
    IObjectNode,
    LayoutNode,
    LayoutPosition,
    LayoutNodeHandleMap,
    ILayoutNodeAccessHandle
} from "./abstractions.js";
import { isObjectField } from "./ObjectField.js";
import type { IObjectFieldConfig } from "./abstractions.js";

interface TabBuilderInternal extends ITabBuilder {
    _build(id: string): ITabDefinition;
}

export class TabBuilder implements TabBuilderInternal {
    private _existing: ITabDefinition | undefined;
    private _label = "";
    private _description: string | undefined;
    private _icon: ITabDefinition["icon"];
    private _layoutFactory: ((l: ILayoutBuilder) => ILayoutNodeBuilder[]) | undefined;
    private _rules: IRule[] | undefined;

    constructor(existing?: ITabDefinition) {
        this._existing = existing;
    }

    label(text: string): this {
        if (this._existing) {
            this._existing.label = text;
        } else {
            this._label = text;
        }
        return this;
    }

    description(text: string): this {
        if (this._existing) {
            this._existing.description = text;
        } else {
            this._description = text;
        }
        return this;
    }

    icon(icon: Icon): this {
        if (this._existing) {
            this._existing.icon = icon;
        } else {
            this._icon = icon;
        }
        return this;
    }

    layout(factory: (l: ILayoutBuilder) => ILayoutNodeBuilder[]): this {
        if (this._existing) {
            this._existing.layout.push(
                ...LayoutBuilderFactory.buildNodes(factory(LayoutBuilderFactory.create()))
            );
        } else {
            this._layoutFactory = factory;
        }
        return this;
    }

    rules(r: IRule[]): this {
        if (this._existing) {
            this._existing.rules = r;
        } else {
            this._rules = r;
        }
        return this;
    }

    _build(id: string): ITabDefinition {
        if (this._existing) {
            return this._existing;
        }
        return {
            id,
            label: this._label,
            description: this._description,
            icon: this._icon,
            layout: this._layoutFactory
                ? LayoutBuilderFactory.buildNodes(
                      this._layoutFactory(LayoutBuilderFactory.create())
                  )
                : [],
            rules: this._rules
        };
    }
}

export class TabsBuilder implements ITabsBuilder {
    private _id: string | undefined;
    private _renderer: string | undefined;
    private _rendererSettings: Record<string, unknown> | undefined;
    private _rules: IRule[] | undefined;
    private _pendingTabs: { tabId: string; tabBuilder: TabBuilderInternal }[] = [];
    private _lastAddedIdx = -1;

    constructor(id?: string) {
        this._id = id;
    }

    renderer(name: string, settings?: Record<string, unknown>): this {
        this._renderer = name;
        this._rendererSettings = settings;
        return this;
    }

    tab(tabId: string, configure: (tab: ITabBuilder) => void): this {
        const tb = new TabBuilder();
        configure(tb);
        this._pendingTabs.push({ tabId, tabBuilder: tb });
        this._lastAddedIdx = this._pendingTabs.length - 1;
        return this;
    }

    before(_target: string): this {
        return this;
    }

    after(_target: string): this {
        return this;
    }

    rules(r: IRule[]): this {
        this._rules = r;
        return this;
    }

    build(): ITabsNode {
        return {
            type: "tabs",
            id: this._id,
            renderer: this._renderer,
            rendererSettings: this._rendererSettings,
            tabs: this._pendingTabs.map(p => p.tabBuilder._build(p.tabId)),
            rules: this._rules
        };
    }
}

export class TabsAccessBuilder implements ITabsBuilder {
    private _lastAddedIdx = -1;

    constructor(private _node: ITabsNode) {}

    renderer(name: string, settings?: Record<string, unknown>): this {
        this._node.renderer = name;
        this._node.rendererSettings = settings;
        return this;
    }

    tab(tabId: string, configure: (tab: ITabBuilder) => void): this {
        const existing = this._node.tabs.find(t => t.id === tabId);
        if (existing) {
            configure(new TabBuilder(existing));
        } else {
            const tb = new TabBuilder();
            configure(tb);
            this._node.tabs.push(tb._build(tabId));
            this._lastAddedIdx = this._node.tabs.length - 1;
        }
        return this;
    }

    before(target: string): this {
        if (this._lastAddedIdx >= 0) {
            const tab = this._node.tabs.splice(this._lastAddedIdx, 1)[0];
            const targetIdx = this._node.tabs.findIndex(t => t.id === target);
            if (targetIdx !== -1) {
                this._node.tabs.splice(targetIdx, 0, tab);
            } else {
                this._node.tabs.push(tab);
            }
        }
        return this;
    }

    after(target: string): this {
        if (this._lastAddedIdx >= 0) {
            const tab = this._node.tabs.splice(this._lastAddedIdx, 1)[0];
            const targetIdx = this._node.tabs.findIndex(t => t.id === target);
            if (targetIdx !== -1) {
                this._node.tabs.splice(targetIdx + 1, 0, tab);
            } else {
                this._node.tabs.push(tab);
            }
        }
        return this;
    }

    rules(r: IRule[]): this {
        this._node.rules = r;
        return this;
    }

    build(): ITabsNode {
        return this._node;
    }
}

export class LayoutBuilderFactory {
    static create(): ILayoutBuilder {
        return {
            row(...fieldIds: string[]): IRowBuilder {
                let position: LayoutPosition | undefined;
                const builder: IRowBuilder = {
                    before(target: string) {
                        position = { type: "before", target };
                        return builder;
                    },
                    after(target: string) {
                        position = { type: "after", target };
                        return builder;
                    },
                    build(): IRowNode {
                        return { type: "row", fieldIds, position };
                    }
                };
                return builder;
            },
            separator(): ISeparatorBuilder {
                let _title: string | undefined;
                let _description: string | undefined;
                let _rules: IRule[] | undefined;
                const builder: ISeparatorBuilder = {
                    title(text: string) {
                        _title = text;
                        return builder;
                    },
                    description(text: string) {
                        _description = text;
                        return builder;
                    },
                    rules(r: IRule[]) {
                        _rules = r;
                        return builder;
                    },
                    build(): ISeparatorNode {
                        return {
                            type: "separator",
                            title: _title,
                            description: _description,
                            rules: _rules
                        };
                    }
                };
                return builder;
            },
            alert(): IAlertBuilder {
                let _message: string | undefined;
                let _alertType: "info" | "success" | "warning" | "danger" = "info";
                let _rules: IRule[] | undefined;
                const builder: IAlertBuilder = {
                    message(text: string) {
                        _message = text;
                        return builder;
                    },
                    alertType(type: "info" | "success" | "warning" | "danger") {
                        _alertType = type;
                        return builder;
                    },
                    rules(r: IRule[]) {
                        _rules = r;
                        return builder;
                    },
                    build(): IAlertNode {
                        return {
                            type: "alert",
                            message: _message,
                            alertType: _alertType,
                            rules: _rules
                        };
                    }
                };
                return builder;
            },
            tabs(id?: string): ITabsBuilder {
                return new TabsBuilder(id);
            },
            element(renderer: string, props?: Record<string, unknown>): IElementBuilder {
                return {
                    build(): IElementNode {
                        return { type: "element", renderer, props };
                    }
                };
            },
            object(
                fieldName: string,
                inner:
                    | ((layout: ILayoutBuilder) => ILayoutNodeBuilder[])
                    | Record<string, (layout: ILayoutBuilder) => ILayoutNodeBuilder[]>
            ): IObjectBuilder {
                return {
                    build(): IObjectNode {
                        return {
                            type: "object",
                            fieldName,
                            inner: LayoutBuilderFactory.resolveObjectInner(inner)
                        };
                    }
                };
            }
        };
    }

    static buildNodes(builders: ILayoutNodeBuilder[]): LayoutNode[] {
        return builders.map(b => b.build());
    }

    static resolvePositionedRows(nodes: LayoutNode[]): LayoutNode[] {
        const result: LayoutNode[] = [];
        const deferred: { node: LayoutNode; position: LayoutPosition }[] = [];

        for (const node of nodes) {
            if (node.type === "row" && node.position) {
                deferred.push({ node, position: node.position });
            } else {
                result.push(node);
            }
        }

        for (const { node, position } of deferred) {
            const targetIndex = result.findIndex(
                n => n.type === "row" && (n as IRowNode).fieldIds.includes(position.target)
            );
            if (targetIndex === -1) {
                result.push(node);
                continue;
            }
            const insertAt = position.type === "after" ? targetIndex + 1 : targetIndex;
            result.splice(insertAt, 0, node);
        }

        return result;
    }

    static resolveObjectInner(
        inner:
            | ((layout: ILayoutBuilder) => ILayoutNodeBuilder[])
            | Record<string, (layout: ILayoutBuilder) => ILayoutNodeBuilder[]>
    ): LayoutNode[] | Record<string, LayoutNode[]> {
        const api = LayoutBuilderFactory.create();
        if (typeof inner === "function") {
            return LayoutBuilderFactory.resolvePositionedRows(
                LayoutBuilderFactory.buildNodes(inner(api))
            );
        }
        const resolved: Record<string, LayoutNode[]> = {};
        for (const [tplId, factory] of Object.entries(inner)) {
            resolved[tplId] = LayoutBuilderFactory.resolvePositionedRows(
                LayoutBuilderFactory.buildNodes(factory(api))
            );
        }
        return resolved;
    }

    static createNodeHandle(node: LayoutNode): ILayoutNodeHandle {
        const handle: ILayoutNodeHandle = {
            node,
            before(target: string): IPositionedLayoutNode {
                handle.position = { type: "before", target };
                return handle;
            },
            after(target: string): IPositionedLayoutNode {
                handle.position = { type: "after", target };
                return handle;
            },
            replace(target: string): IPositionedLayoutNode {
                handle.position = { type: "replace", target };
                return handle;
            }
        };
        return handle;
    }

    static matchesNodeId(node: LayoutNode, nodeId: string): boolean {
        if ("id" in node && node.id === nodeId) {
            return true;
        }
        if (node.type === "object" && node.fieldName === nodeId) {
            return true;
        }
        return false;
    }

    static findNodeById(layout: LayoutNode[], nodeId: string): LayoutNode | undefined {
        for (const node of layout) {
            if (LayoutBuilderFactory.matchesNodeId(node, nodeId)) {
                return node;
            }
            if (node.type === "tabs") {
                for (const tab of node.tabs) {
                    const found = LayoutBuilderFactory.findNodeById(tab.layout, nodeId);
                    if (found) {
                        return found;
                    }
                }
            }
        }
        return undefined;
    }

    static resolveTabDefinition(input: ITabDefinitionInput): ITabDefinition {
        const api = LayoutBuilderFactory.create();
        return {
            id: input.id,
            label: input.label,
            description: input.description,
            icon: input.icon,
            rules: input.rules,
            layout: LayoutBuilderFactory.buildNodes(input.layout(api))
        };
    }

    static tabsNodeKey(node: ITabsNode): string {
        return `__tabs_${node.tabs.map(t => t.id).join("_")}`;
    }

    static accessNode(layout: LayoutNode[], nodeId: string): ILayoutNodeAccessHandle {
        return {
            as: <T extends keyof LayoutNodeHandleMap>(type: T): LayoutNodeHandleMap[T] => {
                const node = LayoutBuilderFactory.findNodeById(layout, nodeId);
                if (!node) {
                    throw new Error(`Layout node "${nodeId}" not found.`);
                }
                if (node.type !== type) {
                    throw new Error(
                        `Layout node "${nodeId}" is type "${node.type}", not "${type}".`
                    );
                }

                if (type === "tabs") {
                    return new TabsAccessBuilder(
                        node as ITabsNode
                    ) as unknown as LayoutNodeHandleMap[T];
                }

                return node as unknown as LayoutNodeHandleMap[T];
            }
        };
    }

    static collectBuilders(
        fields: Map<string, IField>,
        builders: Map<string, IFieldBuilder> | Record<string, IFieldBuilder>,
        predicate: (builder: IFieldBuilder) => boolean,
        result: IFieldBuilder[]
    ): void {
        const entries = builders instanceof Map ? builders.entries() : Object.entries(builders);
        for (const [name, builder] of entries) {
            if (predicate(builder)) {
                result.push(builder);
            }
            const field = fields instanceof Map ? fields.get(name) : undefined;
            if (field && isObjectField(field)) {
                LayoutBuilderFactory.collectBuilders(
                    field.children,
                    field.config.childBuilders,
                    predicate,
                    result
                );
                const templates = (field.config as IObjectFieldConfig).templates;
                if (templates) {
                    for (const tpl of templates) {
                        LayoutBuilderFactory.collectBuildersFlat(
                            tpl.childBuilders,
                            predicate,
                            result
                        );
                    }
                }
            }
        }
    }

    static collectFieldIds(layout: LayoutNode[]): string[] {
        const ids: string[] = [];
        for (const node of layout) {
            if (node.type === "row") {
                ids.push(...node.fieldIds);
            } else if (node.type === "tabs") {
                for (const tab of node.tabs) {
                    ids.push(...LayoutBuilderFactory.collectFieldIds(tab.layout));
                }
            } else if (node.type === "object") {
                ids.push(node.fieldName);
            }
        }
        return ids;
    }

    static collectBuildersFlat(
        builders: Record<string, IFieldBuilder>,
        predicate: (builder: IFieldBuilder) => boolean,
        result: IFieldBuilder[]
    ): void {
        for (const builder of Object.values(builders)) {
            if (predicate(builder)) {
                result.push(builder);
            }
        }
    }
}
