import {
    CmsModelAst,
    CmsModelFieldAstNodeField,
    CmsModelFieldAstNode,
    ContentEntryValueVisitor,
    CmsModelFieldAstNodeCollection,
    CmsEntryValues
} from "~/types";

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

const emptyValues = [null, undefined];

export interface IContentEntryTraverser {
    traverse(values: CmsEntryValues, visitor: ContentEntryValueVisitor): Promise<void>;
}

export class ContentEntryTraverser implements IContentEntryTraverser {
    private readonly modelAst: CmsModelAst;

    constructor(modelAst: CmsModelAst) {
        this.modelAst = modelAst;
    }

    async traverse(values: CmsEntryValues, visitor: ContentEntryValueVisitor) {
        await this.visitTree(this.modelAst, values, [], visitor);
    }

    private async visitTree(
        root: CmsModelAst | CmsModelFieldAstNode,
        values: CmsEntryValues,
        path: string[],
        visitor: ContentEntryValueVisitor
    ) {
        for (const node of root.children) {
            const context: VisitorContext = { node, parent: root };
            const field = this.getFieldFromNode(context);
            let value = values[field.fieldId];

            // We do not descend into nodes if they're `null` or `undefined`.
            if (nodeHasChildren(node) && emptyValues.includes(value)) {
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
            value = values[field.fieldId];

            if (nodeHasChildren(node) && childrenAreCollections(node)) {
                if (field.multipleValues) {
                    const arrayValue = this.ensureArray(value);
                    for (let i = 0; i < arrayValue.length; i++) {
                        await this.findCollectionAndVisit(
                            node,
                            arrayValue[i],
                            [...fieldPath, i.toString()],
                            visitor
                        );
                    }
                } else {
                    await this.findCollectionAndVisit(node, value, fieldPath, visitor);
                }
                continue;
            }

            if (field.multipleValues) {
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

            await this.visitTree(node, value, fieldPath, visitor);
        }
    }

    private ensureArray(value: any) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value;
    }

    private findCollectionAndVisit(
        node: NodeWithCollections,
        values: CmsEntryValues,
        path: string[],
        visitor: ContentEntryValueVisitor
    ) {
        const collection = node.children.find(child => {
            // Use the `discriminator` to find the correct value.
            return values[child.collection.discriminator] === child.collection.id;
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
