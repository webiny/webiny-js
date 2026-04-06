import type { CmsModelField, CmsModelFieldAstNode, ICmsModelFieldToAst } from "~/types/index.js";
import type { CmsModelFieldToGraphQL } from "~/features/graphql/index.js";

export class CmsModelFieldToAstFromPlugin implements ICmsModelFieldToAst {
    private readonly converter: ICmsModelFieldToAst;
    private field: CmsModelFieldToGraphQL.Interface;

    constructor(field: CmsModelFieldToGraphQL.Interface, converter: ICmsModelFieldToAst) {
        this.converter = converter;
        this.field = field;
    }

    toAst(field: CmsModelField): CmsModelFieldAstNode {
        return this.field.getFieldAst
            ? this.field.getFieldAst(field, this.converter)
            : { type: "field", field, children: [] };
    }
}
