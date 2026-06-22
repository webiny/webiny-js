import {
    ErrorResponse,
    GraphQLSchemaPlugin,
    ListResponse,
    Response
} from "@webiny/handler-graphql";
import { emptyResolver } from "./utils.js";
import type { CreateFilesTypeDefsParams } from "~/graphql/createFilesTypeDefs.js";
import { createFilesTypeDefs } from "~/graphql/createFilesTypeDefs.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import { GetFileUseCase } from "~/features/file/GetFile/abstractions.js";
import { ListFilesUseCase } from "~/features/file/ListFiles/abstractions.js";
import { ListTagsUseCase } from "~/features/file/ListTags/abstractions.js";
import { CreateFileUseCase } from "~/features/file/CreateFile/abstractions.js";
import { CreateFilesInBatchUseCase } from "~/features/file/CreateFilesInBatch/abstractions.js";
import { UpdateFileUseCase } from "~/features/file/UpdateFile/abstractions.js";
import { DeleteFileUseCase } from "~/features/file/DeleteFile/abstractions.js";
import { FileUrlGenerator } from "~/features/file/FileUrlGenerator/abstractions.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { FileModel } from "~/domain/file/abstractions.js";

export const createFilesSchema = (params: CreateFilesTypeDefsParams) => {
    const fileManagerGraphQL = new GraphQLSchemaPlugin<ApiCoreContext>({
        typeDefs: createFilesTypeDefs(params),
        resolvers: {
            Query: {
                fileManager: emptyResolver
            },
            Mutation: {
                fileManager: emptyResolver
            },
            FmFile: {
                src(file, _, context) {
                    const urlGenerator = context.container.resolve(FileUrlGenerator);
                    return urlGenerator.generateUrl(file);
                }
            },
            FmQuery: {
                async getFileModel(_, __, context) {
                    const identity = context.security.getIdentity();
                    if (!identity) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const fileModel = context.container.resolve(FileModel);
                        return new Response(fileModel);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                async getFile(_, args: any, context) {
                    const getFile = context.container.resolve(GetFileUseCase);
                    const result = await getFile.execute(args.id);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                },
                async listFiles(_, args, context) {
                    const listFiles = context.container.resolve(ListFilesUseCase);
                    const result = await listFiles.execute(args);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new ListResponse(result.value.items, result.value.meta);
                },
                async listTags(_, args: any, context) {
                    const listTags = context.container.resolve(ListTagsUseCase);
                    const result = await listTags.execute(args || {});

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                }
            },
            FmMutation: {
                async createFile(_, args: any, context) {
                    const createFile = context.container.resolve(CreateFileUseCase);
                    const result = await createFile.execute(args.data);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                },
                async createFiles(_, args: any, context) {
                    const createFilesInBatch = context.container.resolve(CreateFilesInBatchUseCase);
                    const result = await createFilesInBatch.execute({
                        files: args.data,
                        meta: args.meta
                    });

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                },
                async updateFile(_, args: any, context) {
                    const updateFile = context.container.resolve(UpdateFileUseCase);
                    const result = await updateFile.execute({
                        id: args.id,
                        ...args.data
                    });

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                },
                async deleteFile(_, args: any, context) {
                    const deleteFile = context.container.resolve(DeleteFileUseCase);
                    const result = await deleteFile.execute(args.id);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    // TODO: deletion from Cloud storage should be implemented in the `api-file-manager-s3` as an event handler
                    return new Response(true);
                }
            }
        }
    });
    fileManagerGraphQL.name = "fm.graphql.files";

    return fileManagerGraphQL;
};
