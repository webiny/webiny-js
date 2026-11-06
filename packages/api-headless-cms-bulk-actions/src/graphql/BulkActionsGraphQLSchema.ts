import type { Container } from "@webiny/di";
import {
    CmsGraphQLSchemaPlugin,
    CmsGraphQLSchemaFactory,
    isHeadlessCmsReady
} from "@webiny/api-headless-cms";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/api-headless-cms/constants.js";
import { ErrorResponse, Response } from "@webiny/api-graphql";
import { HeadlessCmsEndpointConfig } from "@webiny/api-headless-cms/HeadlessCmsEndpointConfig.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/api-aco/constants.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TriggerTaskUseCase } from "@webiny/background-tasks/api";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";
import { BulkActionName } from "~/domain/BulkActionName.js";
import { BULK_ACTION_LIST_TASK_ID } from "~/features/EntriesBulkAction/createBulkActionTasks.js";
import { RequestContainer } from "@webiny/event-handler-core";
import type { HcmsBulkActionsContext } from "~/types.js";

interface RequiredEntryAccess {
    rwd?: string;
    pw?: string;
}

/**
 * The permission each bulk action requires on the model, matching the single-entry use case it runs.
 * Custom bulk actions require write access.
 */
const getRequiredAccess = (action: string): RequiredEntryAccess => {
    switch (action) {
        case BulkActionName.from("delete"):
        case BulkActionName.from("moveToTrash"):
            return { rwd: "d" };
        case BulkActionName.from("publish"):
            return { pw: "p" };
        case BulkActionName.from("unpublish"):
            return { pw: "u" };
        default:
            return { rwd: "w" };
    }
};

class BulkActionsGraphQLSchemaImpl implements CmsGraphQLSchemaFactory.Interface {
    constructor(private readonly container: Container) {}

    async execute() {
        const context = { container: this.container } as HcmsBulkActionsContext;
        const tenantCtx = this.container.resolve(TenantContext);
        const tenant = tenantCtx.getTenant();

        // Bulk actions change entries, so they are only part of the manage API.
        if (this.container.resolve(HeadlessCmsEndpointConfig).type !== "manage") {
            return [];
        }

        if (!(await isHeadlessCmsReady(context))) {
            return [];
        }

        const identityCtx = this.container.resolve(IdentityContext);
        const modelsResult = await identityCtx.withoutAuthorization(async () => {
            return this.container.resolve(ListModelsUseCase).execute();
        });

        if (modelsResult.isFail()) {
            return [];
        }

        const allModels = modelsResult.value.filter(model => {
            if (model.isPrivate) {
                return false;
            }
            const tags = Array.isArray(model.tags) ? model.tags : [];
            return !tags.includes(CMS_MODEL_SINGLETON_TAG);
        });

        const bulkActions = this.container.resolveAll(EntriesBulkAction);
        const plugins: CmsGraphQLSchemaPlugin<HcmsBulkActionsContext>[] = [];

        const defaultPlugin = new CmsGraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                type BulkActionResponseData {
                    id: String
                }

                type BulkActionResponse {
                    data: BulkActionResponseData
                    error: CmsError
                }
            `
        });
        defaultPlugin.name = "headless-cms.graphql.schema.bulkAction.default";
        plugins.push(defaultPlugin);

        for (const model of allModels) {
            const applicableActions = bulkActions.filter(action => {
                if (action.modelIds?.length) {
                    return action.modelIds.includes(model.modelId);
                }
                return true;
            });

            const enumValues = applicableActions
                .map(action => BulkActionName.from(action.name))
                .join("\n                        ");

            const modelPlugin = new CmsGraphQLSchemaPlugin<HcmsBulkActionsContext>({
                typeDefs: /* GraphQL */ `
                    enum BulkAction${model.singularApiName}Name {
                        _empty
                        ${enumValues}
                    }

                    extend type Mutation {
                        bulkAction${model.singularApiName}(
                            action: BulkAction${model.singularApiName}Name!
                            where: ${model.singularApiName}ListWhereInput
                            search: String
                            data: JSON
                        ): BulkActionResponse
                    }
                `,
                resolvers: {
                    Mutation: {
                        [`bulkAction${model.singularApiName}`]: async (_, args, context) => {
                            const canAccess = await context.container
                                .resolve(AccessControl)
                                .canAccessEntry({
                                    model,
                                    ...getRequiredAccess(args.action)
                                });
                            if (!canAccess) {
                                return new ErrorResponse(EntryNotAuthorizedError.fromModel(model));
                            }

                            /**
                             * Bulk action tasks run without authorization, so the target folder of a
                             * move is checked here, with the same folder-level permission check the
                             * single-entry move uses.
                             */
                            if (args.action === BulkActionName.from("moveToFolder")) {
                                const folderId = args.data?.folderId;
                                if (!folderId) {
                                    return new ErrorResponse({
                                        code: "VALIDATION_FAILED",
                                        message: `Missing "data.folderId" in the input.`
                                    });
                                }
                                const [flp] = context.container.resolveAll(FolderLevelPermissions);
                                if (
                                    folderId !== ROOT_FOLDER &&
                                    flp &&
                                    flp.canUseFolderLevelPermissions()
                                ) {
                                    const permissions =
                                        await flp.getFolderLevelPermissions(folderId);
                                    const canAccessFolder = await flp.canAccessFolderContent({
                                        permissions,
                                        rwd: "w"
                                    });
                                    if (!canAccessFolder) {
                                        return new ErrorResponse(
                                            EntryNotAuthorizedError.fromModel(model)
                                        );
                                    }
                                }
                            }

                            const identity = context.container
                                .resolve(IdentityContext)
                                .getIdentity();

                            const response = await context.container
                                .resolve(TriggerTaskUseCase)
                                .execute({
                                    definition: BULK_ACTION_LIST_TASK_ID,
                                    input: {
                                        actionName: args.action,
                                        modelId: model.modelId,
                                        where: args.where,
                                        search: args.search,
                                        data: args.data,
                                        identity
                                    }
                                });

                            return new Response({
                                id: response.value.id
                            });
                        }
                    }
                },
                isApplicable: context =>
                    context.container.resolve(TenantContext).getTenant().id === tenant.id
            });

            modelPlugin.name = `headless-cms.graphql.schema.bulkAction.${model.modelId}`;
            plugins.push(modelPlugin);
        }

        return plugins;
    }
}

export const BulkActionsGraphQLSchema = CmsGraphQLSchemaFactory.createImplementation({
    implementation: BulkActionsGraphQLSchemaImpl,
    dependencies: [RequestContainer]
});
