/**
 * CMS Model AST
 */
import { CmsModelField } from "./modelField";

export interface ICmsModelFieldToAst {
    toAst(field: CmsModelField): CmsModelFieldAstNode;
}

export type CmsModelAst = {
    type: "root";
    children: CmsModelFieldAstNode[];
};

export type CmsModelFieldAstNodeCollection = {
    type: "collection";
    collection: { discriminator: string } & Record<string, any>;
    children: CmsModelFieldAstNode[];
};

export type CmsModelFieldAstNodeField = {
    type: "field";
    field: CmsModelField;
    children: CmsModelFieldAstNode[];
};

export type CmsModelFieldAstNode = CmsModelFieldAstNodeCollection | CmsModelFieldAstNodeField;

export interface GetCmsModelFieldAst<TField> {
    (field: TField, converter: ICmsModelFieldToAst): CmsModelFieldAstNode;
}

export interface ContentEntryNode {
    field: CmsModelField;
    value: any;
    path: string;
    // parentField: CmsModelField | undefined;
    // parent => parent object (e.g., entry)
}

export interface ContentEntryNodeContext {
    node: CmsModelAst | CmsModelFieldAstNode;
    parent: CmsModelAst | CmsModelFieldAstNode | null;
}

export interface ContentEntryValueVisitor {
    (params: ContentEntryNode, context: ContentEntryNodeContext):
        | Promise<void | unknown>
        | void
        | unknown;
}
