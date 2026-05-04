import { isObjectField } from "./ObjectField.js";
import { LayoutBuilderFactory } from "./LayoutBuilderFactory.js";
import type { IField, IObjectField, LayoutNode, IObjectNode } from "./abstractions.js";

export interface TabActivation {
    tabKey: string;
    tabId: string;
}

export class FocusManager {
    constructor(private _fields: Map<string, IField>) {}

    buildFocusPath(name: string, layout: LayoutNode[]): TabActivation[] | null {
        const segments = name.split(".");
        return this.walkLayout(layout, segments, this._fields);
    }

    private walkLayout(
        layout: LayoutNode[],
        segments: string[],
        fieldScope: Map<string, IField>
    ): TabActivation[] | null {
        const target = segments[0];

        for (const node of layout) {
            switch (node.type) {
                case "row": {
                    if (!node.fieldIds.includes(target)) {
                        break;
                    }
                    return this.diveIntoField(target, segments, fieldScope);
                }
                case "object": {
                    if (node.fieldName !== target) {
                        break;
                    }
                    return this.diveIntoObjectNode(node, segments, fieldScope);
                }
                case "tabs": {
                    const tabKey = node.id || LayoutBuilderFactory.tabsNodeKey(node);
                    for (const tab of node.tabs) {
                        const result = this.walkLayout(tab.layout, segments, fieldScope);
                        if (result !== null) {
                            return [{ tabKey, tabId: tab.id }, ...result];
                        }
                    }
                    break;
                }
            }
        }
        return null;
    }

    private diveIntoField(
        fieldName: string,
        segments: string[],
        fieldScope: Map<string, IField>
    ): TabActivation[] | null {
        if (segments.length === 1) {
            return [];
        }
        const field = fieldScope.get(fieldName);
        if (!field || !isObjectField(field)) {
            return [];
        }
        const childScope = this.resolveChildScope(field, segments);
        if (!childScope) {
            return [];
        }
        const inner = field.getInnerLayout();
        if (!inner) {
            return [];
        }
        return this.walkLayout(inner, childScope.segments, childScope.children);
    }

    private diveIntoObjectNode(
        node: IObjectNode,
        segments: string[],
        fieldScope: Map<string, IField>
    ): TabActivation[] | null {
        if (segments.length === 1) {
            return [];
        }
        const field = fieldScope.get(node.fieldName);
        if (!field || !isObjectField(field)) {
            return [];
        }
        const childScope = this.resolveChildScope(field, segments);
        if (!childScope) {
            return [];
        }
        const inner = Array.isArray(node.inner)
            ? node.inner
            : field.activeTemplateId
              ? (node.inner[field.activeTemplateId] ?? null)
              : null;
        if (!inner) {
            const stored = field.getInnerLayout();
            if (!stored) {
                return [];
            }
            return this.walkLayout(stored, childScope.segments, childScope.children);
        }
        return this.walkLayout(inner, childScope.segments, childScope.children);
    }

    private resolveChildScope(
        field: IObjectField,
        segments: string[]
    ): { segments: string[]; children: Map<string, IField> } | null {
        const nextSegment = segments[1];
        if (field.isList) {
            const index = parseInt(nextSegment, 10);
            if (!isNaN(index)) {
                const item = field.items[index];
                if (!item) {
                    return null;
                }
                return { segments: segments.slice(2), children: item.children };
            }
        }
        return { segments: segments.slice(1), children: field.children };
    }
}
