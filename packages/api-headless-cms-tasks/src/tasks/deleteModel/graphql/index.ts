import zod from "zod";
import { ContextPlugin } from "@webiny/api";
import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { validateConfirmation } from "../helpers/confirmation";
import type { HcmsTasksContext } from "~/types";
import { createResolverDecorator, ErrorResponse, resolve, Response } from "@webiny/handler-graphql";
import { createZodError } from "@webiny/utils";
import type { IDeleteCmsModelTask } from "~/tasks/deleteModel/types";
import type { CmsModel } from "@webiny/api-headless-cms/types";

const deleteValidation = zod
    .object({
        modelId: zod.string(),
        confirmation: zod.string()
    })
    .superRefine((value, context) => {
        if (validateConfirmation(value)) {
            return;
        }
        context.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `Confirmation input does not match.`,
            fatal: true,
            path: ["confirmation"]
        });
    })
    .readonly();

const cancelValidation = zod
    .object({
        modelId: zod.string()
    })
    .readonly();

const getValidation = zod
    .object({
        modelId: zod.string()
    })
    .readonly();

export const createDeleteModelGraphQl = <T extends HcmsTasksContext = HcmsTasksContext>() => {
    const contextPlugin = new ContextPlugin<T>(async inputContext => {
        const ready = await isHeadlessCmsReady(inputContext);

        if (!ready || !inputContext.cms.MANAGE) {
            return;
        }

        const plugin = new CmsGraphQLSchemaPlugin<T>({
            typeDefs: /* GraphQL */ `
                enum DeleteCmsModelTaskStatus {
                    running
                    done
                    error
                    canceled
                }
                type DeleteCmsModelTask {
                    id: ID!
                    status: DeleteCmsModelTaskStatus!
                    deleted: Int!
                    total: Int!
                }

                type GetDeleteCmsModelProgressResponse {
                    data: DeleteCmsModelTask
                    error: CmsError
                }

                type FullyDeleteCmsModelResponse {
                    data: DeleteCmsModelTask
                    error: CmsError
                }

                type CancelDeleteCmsModelResponse {
                    data: DeleteCmsModelTask
                    error: CmsError
                }

                extend type CmsContentModel {
                    isBeingDeleted: Boolean!
                }

                extend type Query {
                    getDeleteModelProgress(modelId: ID!): GetDeleteCmsModelProgressResponse!
                    listContentModels(
                        includeBeingDeleted: Boolean = false
                    ): CmsContentModelListResponse
                }

                extend type Mutation {
                    fullyDeleteModel(
                        modelId: ID!
                        confirmation: String!
                    ): FullyDeleteCmsModelResponse!
                    cancelFullyDeleteModel(modelId: ID!): CancelDeleteCmsModelResponse!
                }
            `,
            resolvers: {
                CmsContentModel: {
                    isBeingDeleted: async (model: CmsModel, _: unknown, context) => {
                        try {
                            return await context.cms.isModelBeingDeleted(model.modelId);
                        } catch (ex) {
                            console.error(ex);
                        }
                        return true;
                    }
                },
                Query: {
                    getDeleteModelProgress: async (_: unknown, args: unknown, context) => {
                        return resolve<IDeleteCmsModelTask>(async () => {
                            const input = getValidation.safeParse(args);
                            if (input.error) {
                                throw createZodError(input.error);
                            }
                            return await context.cms.getDeleteModelProgress(input.data.modelId);
                        });
                    }
                },
                Mutation: {
                    fullyDeleteModel: async (_: unknown, args: unknown, context) => {
                        return resolve<IDeleteCmsModelTask>(async () => {
                            const input = deleteValidation.safeParse(args);
                            if (input.error) {
                                throw createZodError(input.error);
                            }
                            return await context.cms.fullyDeleteModel(input.data.modelId);
                        });
                    },
                    cancelFullyDeleteModel: async (_: unknown, args: unknown, context) => {
                        return resolve<IDeleteCmsModelTask>(async () => {
                            const input = cancelValidation.safeParse(args);
                            if (input.error) {
                                throw createZodError(input.error);
                            }
                            return await context.cms.cancelFullyDeleteModel(input.data.modelId);
                        });
                    }
                }
            },
            resolverDecorators: {
                ["Query.listContentModels"]: [
                    createResolverDecorator<any, any, HcmsTasksContext>(
                        resolver => async (parent, args, context, info) => {
                            // TODO @bruno figure out how to fix these types
                            const result = (await resolver(parent, args, context, info)) as any;
                            if (result.error || !Array.isArray(result.data)) {
                                return result;
                            }

                            if (args?.includeBeingDeleted !== false) {
                                return result;
                            }

                            const listed = result.data as CmsModel[];

                            try {
                                const beingDeletedList = await context.cms.listModelsBeingDeleted();

                                return new Response(
                                    listed.filter(model => {
                                        if (!model?.modelId) {
                                            return false;
                                        } else if (
                                            beingDeletedList.some(
                                                item => item.modelId === model.modelId
                                            )
                                        ) {
                                            return false;
                                        }
                                        return true;
                                    })
                                );
                            } catch (ex) {
                                return new ErrorResponse(ex);
                            }
                        }
                    )
                ]
            }
        });
        plugin.name = "headless-cms.graphql.fullyDeleteModel";
        inputContext.plugins.register(plugin);
    });
    contextPlugin.name = "headless-cms.context.createDeleteModelGraphQl";
    return contextPlugin;
};
