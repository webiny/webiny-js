import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { ErrorResponse } from "@webiny/handler-graphql";
import { ListResponse } from "@webiny/handler-graphql";
import { NotFoundResponse } from "@webiny/handler-graphql";
import { Response } from "@webiny/handler-graphql";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields.js";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields.js";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { GetFileUseCase } from "~/features/file/GetFile/abstractions.js";
import { ListFilesUseCase } from "~/features/file/ListFiles/abstractions.js";
import { ListTagsUseCase } from "~/features/file/ListTags/abstractions.js";
import { CreateFileUseCase } from "~/features/file/CreateFile/abstractions.js";
import { CreateFilesInBatchUseCase } from "~/features/file/CreateFilesInBatch/abstractions.js";
import { UpdateFileUseCase } from "~/features/file/UpdateFile/abstractions.js";
import { DeleteFileUseCase } from "~/features/file/DeleteFile/abstractions.js";
import { GetFileByUrlUseCase } from "~/features/file/GetFileByUrl/abstractions.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { UpdateSettingsUseCase } from "~/features/settings/UpdateSettings/abstractions.js";
import { FileUrlGenerator } from "~/features/file/FileUrlGenerator/abstractions.js";
import { FileModel } from "~/domain/file/abstractions.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

const removeFieldRequiredValidation = (field: CmsModelField) => {
    if (field.validation) {
        field.validation = field.validation.filter(validation => validation.name !== "required");
    }
    if (field.listValidation) {
        field.listValidation = field.listValidation.filter(v => v.name !== "required");
    }
    return field;
};

const createUpdateFields = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.reduce<CmsModelField[]>((collection, field) => {
        collection.push(removeFieldRequiredValidation({ ...field }));
        return collection;
    }, []);
};

class FmGraphQLSchema_ implements GraphQLSchemaFactory.Interface {
    public constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly listModelsUseCase: ListModelsUseCase.Interface,
        private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface,
        private readonly fileModel: FileModel.Interface,
        private readonly fileUrlGenerator: FileUrlGenerator.Interface
    ) {}

    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        if (this.fileUrlGenerator.init) {
            await this.fileUrlGenerator.init();
        }

        this.addBaseTypeDefs(builder);
        await this.addFileTypeDefs(builder);
        this.addSettingsResolvers(builder);
        this.addFileQueryResolvers(builder);
        this.addFileMutationResolvers(builder);

        return builder;
    }

    private addBaseTypeDefs(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addTypeDefs(/* GraphQL */ `
            type FmError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type FmCreatedBy {
                id: ID
                displayName: String
                type: String
            }

            type FmListMeta {
                cursor: String
                totalCount: Int
                hasMoreItems: Boolean
            }

            type FmBooleanResponse {
                data: Boolean
                error: FmError
            }

            type FmSettings {
                uploadMinFileSize: Number
                uploadMaxFileSize: Number
                srcPrefix: String
            }

            input FmSettingsInput {
                uploadMinFileSize: Number
                uploadMaxFileSize: Number
                srcPrefix: String
            }

            type FmSettingsResponse {
                data: FmSettings
                error: FmError
            }

            type FmDeleteResponse {
                data: Boolean
                error: FmError
            }

            type FmQuery {
                getSettings: FmSettingsResponse
            }

            type FmMutation {
                updateSettings(data: FmSettingsInput): FmSettingsResponse
            }

            extend type Query {
                fileManager: FmQuery
            }

            extend type Mutation {
                fileManager: FmMutation
            }
        `);

        builder.addResolver({
            path: "Query.fileManager",
            resolver: () => {
                return () => ({});
            }
        });

        builder.addResolver({
            path: "Mutation.fileManager",
            resolver: () => {
                return () => ({});
            }
        });
    }

    private async addFileTypeDefs(builder: GraphQLSchemaFactory.SchemaBuilder): Promise<void> {
        const models = await this.loadModels();
        const { fields } = this.fileModel;

        const fieldTypes = renderFields({
            models,
            model: this.fileModel,
            fields,
            type: "manage",
            fieldRegistry: this.fieldRegistry
        });

        const inputCreateFields = renderInputFields({
            models,
            model: this.fileModel,
            fields,
            fieldRegistry: this.fieldRegistry
        });

        const inputUpdateFields = renderInputFields({
            models,
            model: this.fileModel,
            fields: createUpdateFields(fields),
            fieldRegistry: this.fieldRegistry
        });

        const listFilterFieldsRender = renderListFilterFields({
            model: this.fileModel,
            fields: this.fileModel.fields,
            type: "manage",
            fieldRegistry: this.fieldRegistry,
            excludeFields: ["entryId", "status"]
        });

        builder.addTypeDefs(/* GraphQL */ `
            type FmFile_Location {
                folderId: ID!
            }

            input FmFile_LocationInput {
                folderId: ID!
            }

            input FmFile_LocationWhereInput {
                folderId: ID
                folderId_in: [ID!]
                folderId_not: ID
                folderId_not_in: [ID!]
            }

            ${fieldTypes.map(f => f.typeDefs).join("\n")}

            type FmFile {
                id: ID!
                createdOn: DateTime!
                modifiedOn: DateTime
                savedOn: DateTime!
                createdBy: FmCreatedBy!
                modifiedBy: FmCreatedBy
                savedBy: FmCreatedBy!
                location: FmFile_Location!
                src: String
                ${fieldTypes.map(f => f.fields).join("\n")}
            }

            ${inputCreateFields.map(f => f.typeDefs).join("\n")}

            input FmCreatedByInput {
                id: ID!
                displayName: String!
                type: String!
            }

            input FmFileCreateInput {
                id: ID!
                createdOn: DateTime
                modifiedOn: DateTime
                savedOn: DateTime
                createdBy: FmCreatedByInput
                modifiedBy: FmCreatedByInput
                savedBy: FmCreatedByInput
                location: FmFile_LocationInput
                ${inputCreateFields.map(f => f.fields).join("\n")}
            }

            input FmFileUpdateInput {
                createdOn: DateTime
                modifiedOn: DateTime
                savedOn: DateTime
                createdBy: FmCreatedByInput
                modifiedBy: FmCreatedByInput
                savedBy: FmCreatedByInput
                location: FmFile_LocationInput
                ${inputUpdateFields.map(f => f.fields).join("\n")}
            }

            type FmFileResponse {
                data: FmFile
                error: FmError
            }

            input FmFileListWhereInput {
                ${listFilterFieldsRender.allFiltersAsString()}
                location: FmFile_LocationWhereInput
                AND: [FmFileListWhereInput!]
                OR: [FmFileListWhereInput!]
            }

            type FmFileListResponse {
                data: [FmFile!]
                error: FmError
                meta: FmListMeta
            }

            enum FmFileListSorter {
                savedOn_ASC
                savedOn_DESC
                createdOn_ASC
                createdOn_DESC
                name_ASC
                name_DESC
                key_ASC
                key_DESC
                type_ASC
                type_DESC
                size_ASC
                size_DESC
            }

            input FmTagsListWhereInput {
                createdBy: String
                tags_startsWith: String
                tags_not_startsWith: String
            }

            type FmTag {
                tag: String!
                count: Number!
            }

            type FmTagsListResponse {
                data: [FmTag!]
                error: FmError
            }

            type FmCreateFilesResponse {
                data: [FmFile!]
                error: FmError
            }

            type FmFileModelResponse {
                data: JSON
                error: FmError
            }

            extend type FmQuery {
                getFileModel: FmFileModelResponse!
                getFile(id: ID!): FmFileResponse!
                getFileByUrl(url: String!): FmFileResponse
                listFiles(
                    search: String
                    where: FmFileListWhereInput
                    limit: Int
                    after: String
                    sort: [FmFileListSorter!]
                ): FmFileListResponse!
                listTags(where: FmTagsListWhereInput): FmTagsListResponse!
            }

            extend type FmMutation {
                createFile(data: FmFileCreateInput!): FmFileResponse!
                createFiles(data: [FmFileCreateInput!]!): FmCreateFilesResponse!
                updateFile(id: ID!, data: FmFileUpdateInput!): FmFileResponse!
                deleteFile(id: ID!): FmBooleanResponse!
            }
        `);
    }

    private addSettingsResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addResolver({
            path: "FmQuery.getSettings",
            dependencies: [GetSettingsUseCase],
            resolver: (getSettings: GetSettingsUseCase.Interface) => {
                return async () => {
                    const result = await getSettings.execute();

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "FmMutation.updateSettings",
            dependencies: [UpdateSettingsUseCase],
            resolver: (updateSettings: UpdateSettingsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await updateSettings.execute(args.data);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });
    }

    private addFileQueryResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addResolver({
            path: "FmFile.src",
            dependencies: [FileUrlGenerator],
            resolver: (urlGenerator: FileUrlGenerator.Interface) => {
                return ({ parent }) => {
                    return urlGenerator.generateUrl(parent);
                };
            }
        });

        builder.addResolver({
            path: "FmQuery.getFileModel",
            dependencies: [FileModel],
            resolver: (fileModel: FileModel.Interface) => {
                return () => {
                    return new Response(fileModel);
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "FmQuery.getFile",
            dependencies: [GetFileUseCase],
            resolver: (getFile: GetFileUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getFile.execute(args.id);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "FmQuery.listFiles",
            dependencies: [ListFilesUseCase],
            resolver: (listFiles: ListFilesUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listFiles.execute(args);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new ListResponse(result.value.items, result.value.meta);
                };
            }
        });

        builder.addResolver({
            path: "FmQuery.listTags",
            dependencies: [ListTagsUseCase],
            resolver: (listTags: ListTagsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listTags.execute(args || {});

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ url: string }>({
            path: "FmQuery.getFileByUrl",
            dependencies: [GetFileByUrlUseCase],
            resolver: (getFileByUrl: GetFileByUrlUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getFileByUrl.execute(args.url);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    if (!result.value) {
                        return new NotFoundResponse("File not found!");
                    }

                    return new Response(result.value);
                };
            }
        });
    }

    private addFileMutationResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addResolver({
            path: "FmMutation.createFile",
            dependencies: [CreateFileUseCase],
            resolver: (createFile: CreateFileUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await createFile.execute(args.data);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "FmMutation.createFiles",
            dependencies: [CreateFilesInBatchUseCase],
            resolver: (createFilesInBatch: CreateFilesInBatchUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await createFilesInBatch.execute({
                        files: args.data,
                        meta: args.meta
                    });

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "FmMutation.updateFile",
            dependencies: [UpdateFileUseCase],
            resolver: (updateFile: UpdateFileUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await updateFile.execute({
                        id: args.id,
                        ...args.data
                    });

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "FmMutation.deleteFile",
            dependencies: [DeleteFileUseCase],
            resolver: (deleteFile: DeleteFileUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await deleteFile.execute(args.id);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(true);
                };
            }
        });
    }

    private async loadModels() {
        const modelsResult = await this.identityContext.withoutAuthorization(() => {
            return this.listModelsUseCase.execute();
        });

        return modelsResult.value;
    }
}

export const FmGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: FmGraphQLSchema_,
    dependencies: [
        IdentityContext,
        ListModelsUseCase,
        CmsModelFieldToGraphQLRegistry,
        FileModel,
        FileUrlGenerator
    ]
});
