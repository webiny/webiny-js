import {
    CmsModelAst,
    CmsModelField,
    CmsModelFieldAstNode,
    CmsModelFieldAstNodeField
} from "~/types";

const nodeHasChildren = (node: CmsModelFieldAstNode) => {
    return node.children.length > 0;
};

type IParentNode = CmsModelAst | CmsModelFieldAstNode | null;

interface IVisitorContext {
    node: CmsModelFieldAstNode;
    parent: IParentNode;
}

export interface IModelFieldTraverserTraverseOnFieldCallableParams {
    field: CmsModelField;
    path: string[];
}

export interface IModelFieldTraverserTraverseOnFieldCallable {
    (params: IModelFieldTraverserTraverseOnFieldCallableParams): void;
}

export interface IModelFieldTraverser {
    traverse(modelAst: CmsModelAst, onField: IModelFieldTraverserTraverseOnFieldCallable): void;
}

export class ModelFieldTraverser implements IModelFieldTraverser {
    public traverse(modelAst: CmsModelAst, onField: IModelFieldTraverserTraverseOnFieldCallable) {
        this.execute(modelAst, [], onField);
    }

    private execute(
        root: CmsModelAst | CmsModelFieldAstNode,
        path: string[],
        onField: IModelFieldTraverserTraverseOnFieldCallable
    ) {
        for (const node of root.children) {
            const field = this.getFieldFromNode({ node, parent: root });
            onField({
                field,
                path: [...path, field.fieldId]
            });

            if (nodeHasChildren(node)) {
                this.execute(node, [...path, field.fieldId], onField);
            }
        }
    }

    private getFieldFromNode({ node, parent }: IVisitorContext) {
        if (node.type === "collection") {
            return (parent as CmsModelFieldAstNodeField).field;
        }

        return (node as CmsModelFieldAstNodeField).field;
    }
}
