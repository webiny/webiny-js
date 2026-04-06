import upperFirst from "lodash/upperFirst.js";
import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldToGraphQLRegistry } from "../abstractions/CmsModelFieldToGraphQLRegistry.js";
import type {
    CmsModel,
    CmsModelField,
    CmsModelFieldType,
    CmsModelFieldDefinition,
    CmsModelObjectField,
    CmsModelFieldToGraphQLPluginValidateChildFieldsParams
} from "~/types/index.js";
import type { CmsModelFieldAstNode, ICmsModelFieldToAst } from "~/types/modelAst.js";
import { createTypeFromFields } from "~/utils/createTypeFromFields.js";

interface CreateTypeNameParams {
    model: Pick<CmsModel, "singularApiName">;
    parents?: string[];
    field: CmsModelField;
}

const createTypeName = (params: CreateTypeNameParams): string => {
    const { model, parents = [], field } = params;
    return [model.singularApiName]
        .concat(parents)
        .concat([field.fieldId])
        .filter(Boolean)
        .map(id => {
            return upperFirst(id);
        })
        .join("_");
};

interface CreateChildTypeDefsParams {
    model: Pick<CmsModel, "singularApiName">;
    field: CmsModelField;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    endpointType: "manage" | "read";
}

const createChildTypeDefs = (params: CreateChildTypeDefsParams): string => {
    const { field, fieldRegistry, model, endpointType } = params;
    const fields = field.settings?.fields || [];

    const typeName = createTypeName({
        model,
        field,
        parents: field.settings?.parents
    });

    const filters = fields
        .map(child => {
            const fieldImpl = fieldRegistry.get(child.type);
            if (!fieldImpl) {
                return null;
            }
            const api = endpointType === "manage" ? fieldImpl.manage : fieldImpl.read;
            const createListFilters = api.createListFilters;
            if (!createListFilters) {
                return null;
            }

            const filters = createListFilters({
                model,
                field: {
                    ...child,
                    settings: {
                        ...child.settings,
                        parents: (child.settings?.parents || []).concat([field.fieldId])
                    }
                },
                fieldRegistry
            });
            if (!filters) {
                return null;
            }
            return filters;
        })
        .filter(Boolean)
        .join("\n");
    return `input ${typeName}WhereInput {
        ${filters || "_empty: String"}
    }\n`;
};

const createObjectListFilters = (
    field: CmsModelField,
    model: Pick<CmsModel, "singularApiName">
): string => {
    const typeName = createTypeName({
        model,
        field,
        parents: field.settings?.parents
    });
    return `${field.fieldId}: ${typeName}WhereInput`;
};

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({
        field,
        models,
        model,
        fieldRegistry
    }: CmsModelFieldToGraphQL.TypeFieldParams): CmsModelFieldDefinition | null {
        const result = createTypeFromFields({
            models,
            typeOfType: "type",
            model,
            type: "read",
            typeNamePrefix: createTypeName({
                model,
                field,
                parents: field.settings?.parents
            }),
            fields: field.settings?.fields || [],
            fieldRegistry
        });

        if (!result) {
            return null;
        }
        const { fieldType, typeDefs } = result;

        const childTypeDefs = createChildTypeDefs({
            model,
            field,
            fieldRegistry,
            endpointType: "read"
        });

        return {
            fields: `${field.fieldId}: ${field.list ? `[${fieldType}!]` : fieldType}`,
            typeDefs: `${typeDefs}${childTypeDefs}`
        };
    }

    public createResolver({
        field,
        createFieldResolvers,
        graphQLType
    }: CmsModelFieldToGraphQL.ResolverParams): CmsModelFieldToGraphQL.Resolver {
        if (!field.settings?.fields || field.settings.fields.length === 0) {
            return false;
        }

        const fieldType = `${graphQLType}_${upperFirst(field.fieldId)}`;

        const typeResolvers = createFieldResolvers({
            graphQLType: fieldType,
            fields: field.settings.fields
        });
        return {
            resolver: null,
            typeResolvers: typeResolvers || {}
        };
    }

    public createListFilters({ field, model }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return createObjectListFilters(field, model);
    }
}

class ManageApi implements CmsModelFieldToGraphQL.ManageApi {
    public createTypeField({
        models,
        model,
        field,
        fieldRegistry
    }: CmsModelFieldToGraphQL.TypeFieldParams): CmsModelFieldDefinition | null {
        const result = createTypeFromFields({
            typeOfType: "type",
            models,
            model,
            type: "manage",
            typeNamePrefix: createTypeName({
                model,
                field,
                parents: field.settings?.parents
            }),
            fields: field.settings?.fields || [],
            fieldRegistry
        });

        if (!result) {
            return null;
        }
        const { fieldType, typeDefs } = result;

        const childTypeDefs = createChildTypeDefs({
            model,
            field,
            fieldRegistry,
            endpointType: "manage"
        });

        return {
            fields: `${field.fieldId}: ${field.list ? `[${fieldType}!]` : fieldType}`,
            typeDefs: `${typeDefs}\n${childTypeDefs}`
        };
    }

    public createInputField({
        models,
        model,
        field,
        fieldRegistry
    }: CmsModelFieldToGraphQL.TypeFieldParams): CmsModelFieldDefinition | null {
        const result = createTypeFromFields({
            typeOfType: "input",
            models,
            model,
            type: "manage",
            typeNamePrefix: createTypeName({
                model,
                field,
                parents: field.settings?.parents
            }),
            fields: field.settings?.fields || [],
            fieldRegistry
        });
        if (!result) {
            return null;
        }
        const { fieldType, typeDefs } = result;

        return {
            fields: `${field.fieldId}: ${field.list ? `[${fieldType}!]` : fieldType}`,
            typeDefs
        };
    }

    public createResolver({
        graphQLType,
        field,
        createFieldResolvers
    }: CmsModelFieldToGraphQL.ResolverParams): CmsModelFieldToGraphQL.Resolver {
        if (!field.settings?.fields || field.settings.fields.length === 0) {
            return false;
        }
        const fieldType = `${graphQLType}_${upperFirst(field.fieldId)}`;
        const typeResolvers = createFieldResolvers({
            graphQLType: fieldType,
            fields: field.settings.fields
        });
        return {
            resolver: null,
            typeResolvers: typeResolvers || {}
        };
    }

    public createListFilters({ field, model }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return createObjectListFilters(field, model);
    }
}

class ObjectToGraphQL implements CmsModelFieldToGraphQL.Interface {
    public readonly read = new ReadApi();
    public readonly manage = new ManageApi();

    public readonly fieldType: CmsModelFieldType = "object";
    public readonly isSearchable: boolean = false;
    public readonly isSortable: boolean = false;
    public readonly isFullTextSearchable: boolean = false;

    public getReadApi(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManageApi(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }

    public validateChildFields(
        params: CmsModelFieldToGraphQLPluginValidateChildFieldsParams<CmsModelField>
    ): void {
        const field = params.field as CmsModelObjectField;
        const originalField = params.originalField as CmsModelObjectField | undefined;
        params.validate({
            fields: field.settings?.fields ?? [],
            originalFields: originalField?.settings?.fields || []
        });
    }

    public getFieldAst(field: CmsModelField, converter: ICmsModelFieldToAst): CmsModelFieldAstNode {
        const objectField = field as CmsModelObjectField;
        const { fields = [], ...settings } = objectField.settings;
        return {
            type: "field",
            field: {
                ...objectField,
                settings: settings || {}
            },
            children: fields.map(f => converter.toAst(f))
        };
    }
}

export const ObjectFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: ObjectToGraphQL,
    dependencies: []
});
