import type { CmsModelField, ICmsModelFieldToAst } from "~/types/index.js";
import type { CmsModelFieldToGraphQL } from "~/features/graphql/index.js";
import { CmsModelFieldToAstFromPlugin } from "./CmsModelFieldToAstFromPlugin.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";

type FieldToAstConverters = Record<string, ICmsModelFieldToAst>;

export class CmsModelFieldToAstConverterFromPlugins implements ICmsModelFieldToAst {
    private readonly converters: FieldToAstConverters;

    public constructor(fields: CmsModelFieldToGraphQL.Interface[]) {
        this.converters = fields.reduce<FieldToAstConverters>((converters, field) => {
            return {
                ...converters,
                [field.fieldType]: new CmsModelFieldToAstFromPlugin(field, this)
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
