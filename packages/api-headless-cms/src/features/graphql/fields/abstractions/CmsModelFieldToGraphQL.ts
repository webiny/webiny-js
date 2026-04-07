import { createAbstraction } from "@webiny/feature/api";
import type { GraphQLFieldResolver, Resolvers } from "@webiny/handler-graphql/types.js";
import type { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types.js";
import type { CmsModelField, CmsModelFieldType } from "~/types/modelField.js";
import type { CmsModel } from "~/types/model.js";
import type { CmsModelFieldDefinition } from "~/types/types.js";
import type { CmsContext } from "~/types/types.js";

export interface ValidateChildFieldsValidateParams<TField extends CmsModelField = CmsModelField> {
    fields: TField[];
    originalFields: TField[];
}

export interface ValidateChildFieldsValidate {
    (params: ValidateChildFieldsValidateParams): void;
}

export interface ValidateChildFieldsParams<TField extends CmsModelField = CmsModelField> {
    field: TField;
    originalField?: TField;
    validate: ValidateChildFieldsValidate;
}

export interface ValidateChildFields<TField extends CmsModelField = CmsModelField> {
    (params: ValidateChildFieldsParams<TField>): void;
}
import type { GenericRecord } from "@webiny/api/types.js";
import type { GetCmsModelFieldAst } from "~/types/modelAst.js";
import type { CmsModelFieldToGraphQLRegistry } from "./CmsModelFieldToGraphQLRegistry.js";

export interface CreateTypeFieldParams<TField extends CmsModelField = CmsModelField> {
    models: CmsModel[];
    model: CmsModel;
    field: TField;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

export interface CreateGetFiltersParams<TField extends CmsModelField = CmsModelField> {
    field: TField;
}

export interface CreateListFiltersParams<TField extends CmsModelField = CmsModelField> {
    model: Pick<CmsModel, "singularApiName">;
    field: TField;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

export interface CreateResolverParams<TField extends CmsModelField = CmsModelField> {
    models: CmsModel[];
    model: CmsModel;
    graphQLType: string;
    field: TField;
    createFieldResolvers: any;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

export type ResolverResult =
    | GraphQLFieldResolver
    | {
          resolver: GraphQLFieldResolver | null;
          typeResolvers: Resolvers<CmsContext>;
      }
    | false;

export interface CreateSchemaParams {
    models: CmsModel[];
}

export interface NormalizeInputParams<TField extends CmsModelField = CmsModelField> {
    model: CmsModel;
    field: TField;
    input: GenericRecord<string> | Array<GenericRecord<string>>;
}

export interface ICmsFieldReadApi<TField extends CmsModelField = CmsModelField> {
    createTypeField(params: CreateTypeFieldParams<TField>): CmsModelFieldDefinition | string | null;
    createGetFilters?(params: CreateGetFiltersParams<TField>): string;
    createListFilters?(params: CreateListFiltersParams<TField>): string;
    createResolver?(params: CreateResolverParams<TField>): ResolverResult;
    createSchema?(params: CreateSchemaParams): GraphQLSchemaDefinition<CmsContext>;
}

export interface ICmsFieldManageApi<TField extends CmsModelField = CmsModelField>
    extends ICmsFieldReadApi<TField> {
    createInputField(
        params: CreateTypeFieldParams<TField>
    ): CmsModelFieldDefinition | string | null;
    normalizeInput?<T>(params: NormalizeInputParams<TField>): Promise<T>;
}

export interface ICmsModelFieldToGraphQL<TField extends CmsModelField = CmsModelField> {
    /* Metadata. */
    readonly fieldType: CmsModelFieldType;
    readonly isSearchable: boolean;
    readonly isSortable: boolean;
    readonly isFullTextSearchable: boolean;

    /* API surfaces. */
    readonly read: ICmsFieldReadApi<TField>;
    readonly manage: ICmsFieldManageApi<TField>;
    getReadApi(): ICmsFieldReadApi<TField>;
    getManageApi(): ICmsFieldManageApi<TField>;

    /* Validation & AST. */
    validateChildFields?: ValidateChildFields<TField>;
    getFieldAst?: GetCmsModelFieldAst<TField>;
}

export const CmsModelFieldToGraphQL = createAbstraction<ICmsModelFieldToGraphQL>(
    "Cms/GraphQL/Schema/ModelField"
);

export namespace CmsModelFieldToGraphQL {
    export type Interface = ICmsModelFieldToGraphQL;
    export type ReadApi<TField extends CmsModelField = CmsModelField> = ICmsFieldReadApi<TField>;
    export type ManageApi<TField extends CmsModelField = CmsModelField> =
        ICmsFieldManageApi<TField>;
    export type TypeFieldParams<TField extends CmsModelField = CmsModelField> =
        CreateTypeFieldParams<TField>;
    export type GetFiltersParams<TField extends CmsModelField = CmsModelField> =
        CreateGetFiltersParams<TField>;
    export type ListFiltersParams<TField extends CmsModelField = CmsModelField> =
        CreateListFiltersParams<TField>;
    export type ResolverParams<TField extends CmsModelField = CmsModelField> =
        CreateResolverParams<TField>;
    export type SchemaParams = CreateSchemaParams;
    export type InputNormalizeParams<TField extends CmsModelField = CmsModelField> =
        NormalizeInputParams<TField>;
    export type Resolver = ResolverResult;
    export type ChildFieldsValidateParams<TField extends CmsModelField = CmsModelField> =
        ValidateChildFieldsParams<TField>;
    export type ChildFieldsValidate<TField extends CmsModelField = CmsModelField> =
        ValidateChildFields<TField>;
    export type ChildFieldsValidateValidate = ValidateChildFieldsValidate;
}
