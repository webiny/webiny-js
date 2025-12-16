import type {
    CmsModelField,
    CmsModelFieldToGraphQLPlugin,
    ICmsModelFieldToAst
} from "~/types/index.js";
import { CmsModelFieldToAstFromPlugin } from "./CmsModelFieldToAstFromPlugin.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";

type FieldToAstConverters = Record<string, ICmsModelFieldToAst>;

export class CmsModelFieldToAstConverterFromPlugins implements ICmsModelFieldToAst {
    private readonly converters: FieldToAstConverters;

    public constructor(plugins: CmsModelFieldToGraphQLPlugin[]) {
        this.converters = plugins.reduce<FieldToAstConverters>((converters, plugin) => {
            return {
                ...converters,
                [plugin.fieldType]: new CmsModelFieldToAstFromPlugin(plugin, this)
            };
        }, {});
    }

    public toAst(field: CmsModelField) {
        const type = getBaseFieldType(field);
        if (!this.converters[type]) {
            throw new Error(
                `Cannot convert model field "${field.fieldId}" to AST. No converter found for field type "${type}".`
            );
        }
        return this.converters[type].toAst(field);
    }
}
