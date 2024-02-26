import {
    ErrorResponse,
    GraphQLSchemaPlugin,
    ListResponse,
    Response
} from "@webiny/handler-graphql";
import { FileManagerContext, FilesListOpts } from "~/types";
import { emptyResolver, resolve } from "./utils";
import { createFilesTypeDefs, CreateFilesTypeDefsParams } from "~/graphql/createFilesTypeDefs";
import { NotAuthorizedResponse } from "@webiny/api-security";

export const createFilesSchema = (params: CreateFilesTypeDefsParams) => {
    const fileManagerGraphQL = new GraphQLSchemaPlugin<FileManagerContext>({
        typeDefs: createFilesTypeDefs(params),
        resolvers: {
            Query: {
                fileManager: emptyResolver
            },
            Mutation: {
                fileManager: emptyResolver
            },
            FmFile: {
                async src(file, _, context: FileManagerContext) {
                    const settings = await context.fileManager.getSettings();
                    return (settings?.srcPrefix || "") + file.key;
                }
            },
            FmQuery: {
                getFileModel(_, __, context) {
                    const identity = context.security.getIdentity();
                    if (!identity) {
                        return new NotAuthorizedResponse();
                    }

                    return resolve(() =>
                        context.security.withoutAuthorization(() => {
                            return context.cms.getModel("fmFile");
                        })
                    );
                },
                getFile(_, args: any, context) {
                    return resolve(() => context.fileManager.getFile(args.id));
                },
                async listFiles(_, args: FilesListOpts, context) {
                    try {
                        const [data, meta] = await context.fileManager.listFiles(args);

                        return new ListResponse(data, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                async listTags(_, args: any, context) {
                    try {
                        const tags = await context.fileManager.listTags(args || {});

                        return new Response(tags);
                    } catch (error) {
                        return new ErrorResponse(error);
                    }
                }
            },
            FmMutation: {
                async createFile(_, args: any, context) {
                    return resolve(() => {
                        return context.fileManager.createFile(args.data, args.meta);
                    });
                },
                async createFiles(_, args: any, context) {
                    return resolve(() => {
                        return context.fileManager.createFilesInBatch(args.data, args.meta);
                    });
                },
                async updateFile(_, args: any, context) {
                    return resolve(() => {
                        return context.fileManager.updateFile(args.id, args.data);
                    });
                },
                async deleteFile(_, args: any, context) {
                    return resolve(async () => {
                        // TODO: Ideally, this should work via a lifecycle hook; first we delete a record from DB, then from cloud storage.
                        const file = await context.fileManager.getFile(args.id);
                        return await context.fileManager.storage.delete({
                            id: file.id,
                            key: file.key
                        });
                    });
                }
            }
        }
    });
    fileManagerGraphQL.name = "fm.graphql.files";

    return fileManagerGraphQL;
};
