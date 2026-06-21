import { runInAction } from "mobx";
import type { ObservableMap } from "mobx";
import { isObjectField } from "./ObjectField.js";
import { LayoutBuilderFactory } from "./LayoutBuilderFactory.js";
import type {
    IField,
    IRule,
    LayoutNode,
    LayoutNodeVM,
    IRowNode,
    IRowNodeVM,
    ISeparatorNode,
    ISeparatorNodeVM,
    ITabsNode,
    ITabsNodeVM,
    ITabDefinitionVM,
    IElementNode,
    IElementNodeVM,
    IObjectNode
} from "./abstractions.js";

type RuleEvaluatorFn = (rules: IRule[] | undefined) => { visible: boolean; disabled: boolean };

export class LayoutResolver {
    constructor(
        private _fields: Map<string, IField>,
        private _activeTabs: ObservableMap<string, string>,
        private _evaluateRules: RuleEvaluatorFn
    ) {}

    resolve(layout: LayoutNode[]): LayoutNodeVM[] {
        return layout.map(node => this.resolveNode(node)).filter(Boolean) as LayoutNodeVM[];
    }

    resolveChildLayout(layout: LayoutNode[], children: Map<string, IField>): LayoutNodeVM[] {
        return layout
            .map(node => this.resolveChildNode(node, children))
            .filter(Boolean) as LayoutNodeVM[];
    }

    collectFieldIds(layout: LayoutNode[]): string[] {
        return LayoutBuilderFactory.collectFieldIds(layout);
    }

    private resolveNode(node: LayoutNode): LayoutNodeVM | null {
        switch (node.type) {
            case "row":
                return this.resolveRowNode(node);
            case "separator":
                return this.resolveSeparatorNode(node);
            case "tabs":
                return this.resolveTabsNode(node);
            case "element":
                return this.resolveElementNode(node);
            case "object":
                return this.resolveObjectNode(node);
            default:
                return null;
        }
    }

    private resolveRowNode(node: IRowNode): IRowNodeVM | null {
        const fields = node.fieldIds
            .map(id => this._fields.get(id))
            .filter((f): f is IField => f !== undefined && f.visible)
            .map(f => f.vm);

        if (fields.length === 0) {
            return null;
        }

        return { type: "row", fields };
    }

    private resolveSeparatorNode(node: ISeparatorNode): ISeparatorNodeVM | null {
        if (node.rules) {
            const state = this._evaluateRules(node.rules);
            if (!state.visible) {
                return null;
            }
        }
        return { type: "separator", title: node.title, description: node.description };
    }

    private resolveTabsNode(node: ITabsNode): ITabsNodeVM | null {
        if (node.tabs.length === 0) {
            return null;
        }

        const containerState = this._evaluateRules(node.rules);
        if (!containerState.visible) {
            return null;
        }

        const tabKey = node.id || LayoutBuilderFactory.tabsNodeKey(node);

        const tabs: ITabDefinitionVM[] = [];
        for (const tab of node.tabs) {
            const tabState = this._evaluateRules(tab.rules);
            if (!tabState.visible) {
                continue;
            }
            tabs.push({
                id: tab.id,
                label: tab.label,
                description: tab.description,
                icon: tab.icon,
                hasErrors: this.tabHasErrors(tab.layout),
                disabled: containerState.disabled || tabState.disabled,
                layout: tab.layout
                    .map(child => this.resolveNode(child))
                    .filter(Boolean) as LayoutNodeVM[]
            });
        }

        if (tabs.length === 0) {
            return null;
        }

        const storedActive = this._activeTabs.get(tabKey);
        const validActive = tabs.find(t => t.id === storedActive) ? storedActive! : tabs[0].id;

        return {
            type: "tabs",
            id: node.id,
            renderer: node.renderer,
            rendererSettings: node.rendererSettings,
            tabs,
            disabled: containerState.disabled,
            activeTabId: validActive,
            setActiveTab: (id: string) => {
                runInAction(() => {
                    this._activeTabs.set(tabKey, id);
                });
            }
        };
    }

    private resolveElementNode(node: IElementNode): IElementNodeVM {
        return {
            type: "element",
            renderer: node.renderer,
            props: node.props
        };
    }

    private resolveObjectNode(node: IObjectNode): IRowNodeVM | null {
        const field = this._fields.get(node.fieldName);
        if (!field || !field.visible) {
            return null;
        }
        return { type: "row", fields: [field.vm] };
    }

    private resolveChildNode(node: LayoutNode, children: Map<string, IField>): LayoutNodeVM | null {
        switch (node.type) {
            case "row": {
                const fields = node.fieldIds
                    .map(id => children.get(id))
                    .filter((f): f is IField => f !== undefined && f.visible)
                    .map(f => f.vm);
                if (fields.length === 0) {
                    return null;
                }
                return { type: "row", fields };
            }
            case "separator":
                return this.resolveSeparatorNode(node);
            case "element":
                return this.resolveElementNode(node);
            case "object": {
                const field = children.get(node.fieldName);
                if (!field || !field.visible) {
                    return null;
                }
                return { type: "row", fields: [field.vm] };
            }
            case "tabs":
                return this.resolveChildTabsNode(node, children);
            default:
                return null;
        }
    }

    private resolveChildTabsNode(
        node: ITabsNode,
        children: Map<string, IField>
    ): ITabsNodeVM | null {
        if (node.tabs.length === 0) {
            return null;
        }
        const containerState = this._evaluateRules(node.rules);
        if (!containerState.visible) {
            return null;
        }
        const tabKey = node.id || LayoutBuilderFactory.tabsNodeKey(node);
        const tabs: ITabDefinitionVM[] = [];
        for (const tab of node.tabs) {
            const tabState = this._evaluateRules(tab.rules);
            if (!tabState.visible) {
                continue;
            }
            tabs.push({
                id: tab.id,
                label: tab.label,
                description: tab.description,
                icon: tab.icon,
                hasErrors: this.childTabHasErrors(tab.layout, children),
                disabled: containerState.disabled || tabState.disabled,
                layout: tab.layout
                    .map(child => this.resolveChildNode(child, children))
                    .filter(Boolean) as LayoutNodeVM[]
            });
        }
        if (tabs.length === 0) {
            return null;
        }
        const storedActive = this._activeTabs.get(tabKey);
        const validActive = tabs.find(t => t.id === storedActive) ? storedActive! : tabs[0].id;
        return {
            type: "tabs",
            id: node.id,
            renderer: node.renderer,
            rendererSettings: node.rendererSettings,
            tabs,
            disabled: containerState.disabled,
            activeTabId: validActive,
            setActiveTab: (id: string) => {
                runInAction(() => {
                    this._activeTabs.set(tabKey, id);
                });
            }
        };
    }

    private tabHasErrors(layout: LayoutNode[]): boolean {
        const fieldIds = this.collectFieldIds(layout);
        for (const id of fieldIds) {
            const field = this._fields.get(id);
            if (!field) {
                continue;
            }
            if (field.vm.validation.isValid === false) {
                return true;
            }
            if (isObjectField(field) && field.hasErrors) {
                return true;
            }
        }
        return false;
    }

    private childTabHasErrors(layout: LayoutNode[], children: Map<string, IField>): boolean {
        for (const node of layout) {
            if (node.type === "row") {
                for (const id of node.fieldIds) {
                    const field = children.get(id);
                    if (!field) {
                        continue;
                    }
                    if (field.vm.validation.isValid === false) {
                        return true;
                    }
                    if (isObjectField(field) && field.hasErrors) {
                        return true;
                    }
                }
            } else if (node.type === "object") {
                const field = children.get(node.fieldName);
                if (field && isObjectField(field) && field.hasErrors) {
                    return true;
                }
            } else if (node.type === "tabs") {
                for (const tab of node.tabs) {
                    if (this.childTabHasErrors(tab.layout, children)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
