import { CmsModelField, CmsModelFieldToGraphQLPlugin, ICmsModelFieldToAst } from "~/types";
import { CmsModelFieldToAstFromPlugin } from "./CmsModelFieldToAstFromPlugin";

type FieldToAstConverters = Record<string, ICmsModelFieldToAst>;

export class CmsModelFieldToAstConverterFromPlugins implements ICmsModelFieldToAst {
    private converters: FieldToAstConverters;

    constructor(plugins: CmsModelFieldToGraphQLPlugin[]) {
        this.converters = plugins.reduce<FieldToAstConverters>((converters, plugin) => {
            return {
                ...converters,
                [plugin.fieldType]: new CmsModelFieldToAstFromPlugin(plugin, this)
            };
        }, {});
    }

    toAst(field: CmsModelField) {
        return this.converters[field.type].toAst(field);
    }
}
