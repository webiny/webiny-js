import { createAbstraction } from "@webiny/feature/api";
import type { GraphQLFieldResolver, Resolvers } from "@webiny/handler-graphql/types.js";
import type { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types.js";
import type { CmsModelField, CmsModelFieldType } from "~/types/modelField.js";
import type { CmsModel } from "~/types/model.js";
import type {
    CmsModelFieldDefinition,
    CmsFieldTypePlugins,
    CmsModelFieldToGraphQLPluginValidateChildFields
} from "~/types/types.js";
import type { CmsContext } from "~/types/types.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { GetCmsModelFieldAst } from "~/types/modelAst.js";

export interface CreateTypeFieldParams<TField extends CmsModelField = CmsModelField> {
    models: CmsModel[];
    model: CmsModel;
    field: TField;
    fieldTypePlugins: CmsFieldTypePlugins;
}

export interface CreateGetFiltersParams<TField extends CmsModelField = CmsModelField> {
    field: TField;
}

export interface CreateListFiltersParams<TField extends CmsModelField = CmsModelField> {
    model: Pick<CmsModel, "singularApiName">;
    field: TField;
    plugins: CmsFieldTypePlugins;
}

export interface CreateResolverParams<TField extends CmsModelField = CmsModelField> {
    models: CmsModel[];
    model: CmsModel;
    graphQLType: string;
    field: TField;
    createFieldResolvers: any;
    fieldTypePlugins: CmsFieldTypePlugins;
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

export interface CreateStorageIdParams<TField extends CmsModelField = CmsModelField> {
    model: CmsModel;
    field: Omit<TField, "storageId"> & Partial<Pick<TField, "storageId">>;
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
    getFieldType(): CmsModelFieldType;
    getIsSearchable(): boolean;
    getIsSortable(): boolean;
    getIsFullTextSearchable(): boolean;

    /* Storage. */
    createStorageId?(params: CreateStorageIdParams<TField>): string | null | undefined;

    /* API surfaces. */
    getRead(): ICmsFieldReadApi<TField>;
    getManage(): ICmsFieldManageApi<TField>;

    /* Validation & AST. */
    validateChildFields?: CmsModelFieldToGraphQLPluginValidateChildFields<TField>;
    getFieldAst?: GetCmsModelFieldAst<TField>;
}

export const CmsModelFieldToGraphQL = createAbstraction<ICmsModelFieldToGraphQL>(
    "Cms/Model/Field/ToGraphQL"
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
    export type StorageIdParams<TField extends CmsModelField = CmsModelField> =
        CreateStorageIdParams<TField>;
    export type InputNormalizeParams<TField extends CmsModelField = CmsModelField> =
        NormalizeInputParams<TField>;
    export type Resolver = ResolverResult;
}
