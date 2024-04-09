import {
    CmsModelField,
    CmsModelFieldAstNode,
    CmsModelFieldToGraphQLPlugin,
    ICmsModelFieldToAst
} from "~/types";

export class CmsModelFieldToAstFromPlugin implements ICmsModelFieldToAst {
    private readonly converter: ICmsModelFieldToAst;
    private plugin: CmsModelFieldToGraphQLPlugin;

    constructor(plugin: CmsModelFieldToGraphQLPlugin, converter: ICmsModelFieldToAst) {
        this.converter = converter;
        this.plugin = plugin;
    }

    toAst(field: CmsModelField): CmsModelFieldAstNode {
        return this.plugin.getFieldAst
            ? this.plugin.getFieldAst(field, this.converter)
            : { type: "field", field, children: [] };
    }
}
