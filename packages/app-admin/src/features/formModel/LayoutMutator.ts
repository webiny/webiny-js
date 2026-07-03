import { LayoutBuilderFactory } from "./LayoutBuilderFactory.js";
import type {
    ILayoutModifier,
    ILayoutNodeHandle,
    IPositionedLayoutNode,
    ILayoutNodeAccessHandle,
    ITabDefinitionInput,
    IRule,
    LayoutNode,
    LayoutPosition,
    IRowNode,
    ISeparatorNode,
    IAlertNode,
    ITabsNode,
    IElementNode,
    IObjectNode,
    ILayoutBuilder,
    ILayoutNodeBuilder
} from "./abstractions.js";

export class LayoutMutator {
    createModifierAPI(removals: string[]): ILayoutModifier {
        return {
            row(...fieldIds: string[]): ILayoutNodeHandle {
                const node: IRowNode = { type: "row", fieldIds };
                return LayoutBuilderFactory.createNodeHandle(node);
            },
            separator(): ILayoutNodeHandle {
                const node: ISeparatorNode = { type: "separator" };
                return LayoutBuilderFactory.createNodeHandle(node);
            },
            alert(): ILayoutNodeHandle {
                const node: IAlertNode = { type: "alert" };
                return LayoutBuilderFactory.createNodeHandle(node);
            },
            tabs(config: {
                id?: string;
                renderer?: string;
                tabs: ITabDefinitionInput[];
                rules?: IRule[];
            }): ILayoutNodeHandle {
                const node: ITabsNode = {
                    type: "tabs",
                    id: config.id,
                    renderer: config.renderer,
                    tabs: config.tabs.map(LayoutBuilderFactory.resolveTabDefinition),
                    rules: config.rules
                };
                return LayoutBuilderFactory.createNodeHandle(node);
            },
            element(renderer: string, props?: Record<string, unknown>): ILayoutNodeHandle {
                const node: IElementNode = { type: "element", renderer, props };
                return LayoutBuilderFactory.createNodeHandle(node);
            },
            object(
                fieldName: string,
                inner:
                    | ((layout: ILayoutBuilder) => ILayoutNodeBuilder[])
                    | Record<string, (layout: ILayoutBuilder) => ILayoutNodeBuilder[]>
            ): ILayoutNodeHandle {
                const node: IObjectNode = {
                    type: "object",
                    fieldName,
                    inner: LayoutBuilderFactory.resolveObjectInner(inner)
                };
                return LayoutBuilderFactory.createNodeHandle(node);
            },
            remove(target: string): void {
                removals.push(target);
            }
        };
    }

    applyModifications(
        layout: LayoutNode[],
        factory: (modifier: ILayoutModifier) => (LayoutNode | IPositionedLayoutNode)[]
    ): LayoutNode[] {
        const removals: string[] = [];
        const modifierAPI = this.createModifierAPI(removals);
        const entries = factory(modifierAPI);

        let result = layout;

        for (const target of removals) {
            result = this.removeFromLayout(result, target);
        }

        for (const entry of entries) {
            if (this.isPositionedNode(entry)) {
                const { node, position } = entry;
                if (position) {
                    result = this.insertIntoLayout(result, node, position);
                } else {
                    result = [...result, node];
                }
            } else {
                result = [...result, entry];
            }
        }

        return result;
    }

    accessNode(layout: LayoutNode[], nodeId: string): ILayoutNodeAccessHandle {
        return LayoutBuilderFactory.accessNode(layout, nodeId);
    }

    removeFromLayout(layout: LayoutNode[], target: string): LayoutNode[] {
        return layout
            .map(node => {
                if (node.type === "row") {
                    const filtered = node.fieldIds.filter(id => id !== target);
                    if (filtered.length === 0) {
                        return null;
                    }
                    return { ...node, fieldIds: filtered };
                }
                if (
                    (node.type === "tabs" && node.id === target) ||
                    (node.type === "element" && (node.id === target || node.renderer === target)) ||
                    (node.type === "object" && node.fieldName === target)
                ) {
                    return null;
                }
                return node;
            })
            .filter(Boolean) as LayoutNode[];
    }

    insertIntoLayout(
        layout: LayoutNode[],
        node: LayoutNode,
        position: LayoutPosition
    ): LayoutNode[] {
        const targetIndex = this.findIndex(layout, position.target);

        if (targetIndex === -1) {
            return [...layout, node];
        }

        const result = [...layout];

        switch (position.type) {
            case "before":
                result.splice(targetIndex, 0, node);
                break;
            case "after":
                result.splice(targetIndex + 1, 0, node);
                break;
            case "replace":
                result.splice(targetIndex, 1, node);
                break;
        }

        return result;
    }

    isPositionedNode(entry: LayoutNode | IPositionedLayoutNode): entry is IPositionedLayoutNode {
        return "node" in entry;
    }

    private findIndex(layout: LayoutNode[], target: string): number {
        return layout.findIndex(node => this.nodeMatchesTarget(node, target));
    }

    private nodeMatchesTarget(node: LayoutNode, target: string): boolean {
        switch (node.type) {
            case "row":
                return node.fieldIds.includes(target);
            case "tabs":
                return node.id === target;
            case "element":
                return node.id === target || node.renderer === target;
            case "object":
                return node.fieldName === target;
            default:
                return false;
        }
    }
}
