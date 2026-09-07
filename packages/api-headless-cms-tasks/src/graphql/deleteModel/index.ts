import zod from "zod";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CmsGraphQLSchemaPlugin, CmsGraphQLSchemaFactory } from "@webiny/api-headless-cms";
import { HeadlessCms } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { DeleteModelOperations } from "~/graphql/deleteModel/abstractions.js";
import type { HcmsTasksContext } from "~/types.js";
import { createResolverDecorator } from "@webiny/api-graphql";
import { ErrorResponse } from "@webiny/api-graphql";
import { resolve } from "@webiny/api-graphql";
import { Response } from "@webiny/api-graphql";
import { createZodError } from "@webiny/utils";
import type { IDeleteCmsModelTask } from "~/features/DeleteModelTask/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { validateConfirmation } from "~/helpers/confirmation.js";

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

/**
 * Contributes the fullyDeleteModel schema. Previously a `RequestContextInitializer` that built the
 * plugin and then registered a `CmsGraphQLSchemaFactory` holding it; since `execute()` is already
 * awaited by `generateSchema`, the readiness check and the plugin construction can simply live
 * there instead.
 */
class DeleteModelGraphQLSchemaFactory implements CmsGraphQLSchemaFactory.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly headlessCms: HeadlessCms.Interface,
        private readonly logger: Logger.Interface
    ) {}

    async execute() {
        type T = HcmsTasksContext;

        // On a fresh project there is no tenant until installation completes; and the delete-model
        // schema only belongs on the MANAGE endpoint. (`isHeadlessCmsReady` only checks the tenant.)
        if (!this.tenantContext.getTenant() || !this.headlessCms.MANAGE) {
            return [];
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
                            return await context.container
                                .resolve(DeleteModelOperations)
                                .isModelBeingDeleted(model.modelId);
                        } catch (ex) {
                            this.logger.error(
                                { error: ex, modelId: model.modelId },
                                "Failed to read the delete-model status."
                            );
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
                            return context.container
                                .resolve(DeleteModelOperations)
                                .getDeleteModelProgress(input.data.modelId);
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
                            return context.container
                                .resolve(DeleteModelOperations)
                                .fullyDeleteModel(input.data.modelId);
                        });
                    },
                    cancelFullyDeleteModel: async (_: unknown, args: unknown, context) => {
                        return resolve<IDeleteCmsModelTask>(async () => {
                            const input = cancelValidation.safeParse(args);
                            if (input.error) {
                                throw createZodError(input.error);
                            }
                            return context.container
                                .resolve(DeleteModelOperations)
                                .cancelFullyDeleteModel(input.data.modelId);
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
                                const beingDeletedList = await context.container
                                    .resolve(DeleteModelOperations)
                                    .listModelsBeingDeleted();

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
        return [plugin];
    }
}

export const DeleteModelGraphQLSchemaFactoryImpl = CmsGraphQLSchemaFactory.createImplementation({
    implementation: DeleteModelGraphQLSchemaFactory,
    dependencies: [TenantContext, HeadlessCms, Logger]
});
