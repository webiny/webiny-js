import {
    ValuesSelectionGenerator as Abstraction,
    type IValuesSelectionGenerator
} from "./abstractions.js";
import { ModelToAstConverter } from "../ModelToAstConverter/abstractions.js";
import type {
    CmsModel,
    CmsModelAst,
    CmsModelFieldAstNode,
    CmsModelFieldAstNodeCollection,
    CmsModelFieldAstNodeField
} from "~/types/index.js";
import { createTypeName } from "~/utils/createTypeName.js";

const REF_SELECTION = "{ id modelId }";

class ValuesSelectionGeneratorImpl implements IValuesSelectionGenerator {
    constructor(private readonly modelToAst: ModelToAstConverter.Interface) {}

    generate(model: CmsModel): string {
        const ast = this.modelToAst.toAst(model);
        const selection = this.walkRoot(ast, model.singularApiName);
        return selection || "_empty";
    }

    private walkRoot(ast: CmsModelAst, typePrefix: string): string {
        return ast.children
            .map(node => this.walkNode(node, typePrefix))
            .filter(Boolean)
            .join("\n");
    }

    private walkNode(node: CmsModelFieldAstNode, typePrefix: string): string | null {
        if (node.type === "field") {
            return this.walkFieldNode(node, typePrefix);
        }
        if (node.type === "collection") {
            return this.walkCollectionNode(node, typePrefix);
        }
        return null;
    }

    private walkFieldNode(node: CmsModelFieldAstNodeField, typePrefix: string): string | null {
        const { field, children } = node;

        if (field.type === "ref") {
            return `${field.fieldId} ${REF_SELECTION}`;
        }

        if (children.length === 0) {
            return field.fieldId;
        }

        const nestedPrefix = `${typePrefix}_${createTypeName(field.fieldId)}`;
        const childSelection = children
            .map(child => this.walkNode(child, nestedPrefix))
            .filter(Boolean)
            .join("\n");

        if (!childSelection) {
            return null;
        }

        return `${field.fieldId} { ${childSelection} }`;
    }

    private walkCollectionNode(
        node: CmsModelFieldAstNodeCollection,
        typePrefix: string
    ): string | null {
        const { collection, children } = node;
        const gqlTypeName = collection.gqlTypeName;

        if (!gqlTypeName) {
            return null;
        }

        const templateType = `${typePrefix}_${gqlTypeName}`;
        const childSelection = children
            .map(child => this.walkNode(child, templateType))
            .filter(Boolean)
            .join("\n");

        return `...on ${templateType} { ${childSelection} _templateId __typename }`;
    }
}

export const ValuesSelectionGenerator = Abstraction.createImplementation({
    implementation: ValuesSelectionGeneratorImpl,
    dependencies: [ModelToAstConverter]
});
