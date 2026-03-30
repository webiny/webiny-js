import type {
    CmsEntryValues,
    CmsModelAst,
    CmsModelFieldAstNode,
    CmsModelFieldAstNodeCollection,
    CmsModelFieldAstNodeField,
    ContentEntryValueVisitor
} from "~/types/index.js";

type ParentNode = CmsModelAst | CmsModelFieldAstNode | null;

type VisitorContext = {
    node: CmsModelFieldAstNode;
    parent: ParentNode;
};

const nodeHasChildren = (node: CmsModelFieldAstNode) => {
    return node.children.length > 0;
};

interface NodeWithCollections extends CmsModelFieldAstNodeField {
    children: CmsModelFieldAstNodeCollection[];
}

const childrenAreCollections = (node: CmsModelFieldAstNode): node is NodeWithCollections => {
    return node.children.every(node => node.type === "collection");
};

export interface IContentEntryTraverser {
    traverse(values: CmsEntryValues, visitor: ContentEntryValueVisitor): Promise<void>;
}

export class ContentEntryTraverser implements IContentEntryTraverser {
    private readonly modelAst: CmsModelAst;

    constructor(modelAst: CmsModelAst) {
        this.modelAst = modelAst;
    }

    async traverse<T extends CmsEntryValues = CmsEntryValues>(
        values: T,
        visitor: ContentEntryValueVisitor
    ) {
        await this.visitTree<T>(this.modelAst, values, [], visitor);
    }

    private async visitTree<T extends CmsEntryValues = CmsEntryValues>(
        root: CmsModelAst | CmsModelFieldAstNode,
        values: T,
        path: string[],
        visitor: ContentEntryValueVisitor
    ) {
        for (const node of root.children) {
            const context: VisitorContext = { node, parent: root };
            const field = this.getFieldFromNode(context);
            const fieldIdKey = field.fieldId as keyof T;
            let value = values[fieldIdKey];

            // We do not descend into nodes if they're `null` or `undefined`.
            if (nodeHasChildren(node) && (value === null || value === undefined)) {
                continue;
            }

            // We do not visit leaf nodes that are `undefined`.
            if (!nodeHasChildren(node) && value === undefined) {
                continue;
            }

            const fieldPath = [...path, field.fieldId];

            await visitor(
                {
                    field,
                    value,
                    path: fieldPath.join(".")
                },
                context
            );

            // Refetch the value from the original input, in case the value changed within the visitor.
            value = values[fieldIdKey];

            if (nodeHasChildren(node) && childrenAreCollections(node)) {
                if (field.list) {
                    const arrayValue = this.ensureArray(value);
                    for (let i = 0; i < arrayValue.length; i++) {
                        await this.findCollectionAndVisit<T>(
                            node,
                            arrayValue[i],
                            [...fieldPath, i.toString()],
                            visitor
                        );
                    }
                    continue;
                }
                await this.findCollectionAndVisit<T>(node, value as T, fieldPath, visitor);
            }

            if (field.list) {
                const arrayValue = this.ensureArray(value);
                for (let i = 0; i < arrayValue.length; i++) {
                    await this.visitTree(
                        node,
                        arrayValue[i],
                        [...fieldPath, i.toString()],
                        visitor
                    );
                }
                continue;
            }

            await this.visitTree<T>(node, value as T, fieldPath, visitor);
        }
    }

    private ensureArray(value: any) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value;
    }

    private findCollectionAndVisit<T extends CmsEntryValues = CmsEntryValues>(
        node: NodeWithCollections,
        values: T,
        path: string[],
        visitor: ContentEntryValueVisitor
    ) {
        const collection = node.children.find(child => {
            // Use the `discriminator` to find the correct value.
            return values[child.collection.discriminator as keyof T] === child.collection.id;
        });

        if (!collection) {
            return;
        }

        return this.visitTree(collection, values, path, visitor);
    }

    private getFieldFromNode({ node, parent }: VisitorContext) {
        if (node.type === "collection") {
            return (parent as CmsModelFieldAstNodeField).field;
        }

        return (node as CmsModelFieldAstNodeField).field;
    }
}
