import type { HcmsBulkActionsContext } from "~/types.js";
import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/api-headless-cms/constants.js";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";
import { BulkActionName } from "~/domain/BulkActionName.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/api-aco/constants.js";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types/index.js";

/**
 * The permission each bulk action requires on the model, matching the single-entry use case it runs.
 * Custom bulk actions require write access.
 */
const getRequiredAccess = (action: string): { rwd?: string; pw?: string } => {
    switch (action) {
        case "Delete":
        case "MoveToTrash":
            return { rwd: "d" };
        case "Publish":
            return { pw: "p" };
        case "Unpublish":
            return { pw: "u" };
        default:
            return { rwd: "w" };
    }
};

/**
 * Bulk action tasks run without authorization, so the target folder of a move is checked here,
 * with the same folder-level permission check the single-entry move uses.
 */
const canMoveToFolder = async (
    context: HcmsBulkActionsContext,
    folderId: string
): Promise<boolean> => {
    if (folderId === ROOT_FOLDER) {
        return true;
    }

    const [flp] = context.container.resolveAll(FolderLevelPermissions);
    if (!flp || !flp.canUseFolderLevelPermissions()) {
        return true;
    }

    const permissions = await flp.getFolderLevelPermissions(folderId);
    return flp.canAccessFolderContent({ permissions, rwd: "w" });
};

/**
 * Whether the caller may run the action only on entries they created. Besides own-only access,
 * this covers several permission sets (e.g. read all entries, delete own), where the action
 * itself is allowed only on own entries: it is checked against an entry the caller doesn't own.
 */
const canActOnlyOnOwnedEntries = async (
    context: HcmsBulkActionsContext,
    model: CmsModel,
    action: string
): Promise<boolean> => {
    const { accessControl } = context.cms;
    if (await accessControl.canAccessOnlyOwnedEntries({ model })) {
        return true;
    }

    const identity = context.security.getIdentity();
    const canActOnOthers = await accessControl.canAccessEntry({
        model,
        entry: {
            entryId: "",
            createdBy: {
                id: `${identity.id}#not-owner`,
                displayName: "",
                type: ""
            }
        },
        ...getRequiredAccess(action)
    });
    return !canActOnOthers;
};

/**
 * Ids of the model's folders whose content the caller can't change with this action.
 */
const listDeniedFolderIds = async (
    context: HcmsBulkActionsContext,
    model: CmsModel,
    action: string
): Promise<string[]> => {
    const [flp] = context.container.resolveAll(FolderLevelPermissions);
    if (!flp || !flp.canUseFolderLevelPermissions()) {
        return [];
    }

    const rwd = getRequiredAccess(action).rwd === "d" ? "d" : "w";

    // Every folder path starts with the root folder.
    const flps = await flp.listFolderLevelPermissions({
        where: { type: `cms:${model.modelId}`, path_startsWith: `${ROOT_FOLDER}/` }
    });

    const denied: string[] = [];
    for (const item of flps) {
        if (!(await flp.canAccessFolderContent({ permissions: item.permissions, rwd }))) {
            denied.push(item.id);
        }
    }
    return denied;
};

/**
 * Bulk action tasks list and change entries without authorization, so the task query is
 * restricted here to the entries the caller may act on: own entries only, when that is all the
 * caller may change, and no entries from folders the caller can't change.
 * The restrictions are set on the top level of `where`, so the client `where` can only narrow them.
 */
const restrictWhere = async (
    context: HcmsBulkActionsContext,
    model: CmsModel,
    action: string,
    initialWhere: CmsEntryListWhere | undefined
): Promise<CmsEntryListWhere> => {
    const where: CmsEntryListWhere = { ...initialWhere };

    if (await canActOnlyOnOwnedEntries(context, model, action)) {
        where.createdBy = context.security.getIdentity().id;
    }

    const deniedFolderIds = await listDeniedFolderIds(context, model, action);
    if (deniedFolderIds.length > 0) {
        // Listing replaces `wbyAco_location` with `location` when both are set, so use the same one.
        const location = where.location ?? where.wbyAco_location ?? {};
        delete where.location;
        where.wbyAco_location = {
            ...location,
            folderId_not_in: [...(location.folderId_not_in ?? []), ...deniedFolderIds]
        };
    }

    return where;
};

export const createBulkActionGraphQL = async (
    context: HcmsBulkActionsContext,
    bulkAction: EntriesBulkAction.Interface
) => {
    const tenant = context.tenancy.getCurrentTenant();

    // TODO: once we have GraphSchema plugin via an abstraction, we'll be able to remove this.
    if (!(await isHeadlessCmsReady(context))) {
        return;
    }

    const models = await context.security.withoutAuthorization(async () => {
        const allModels = await context.cms.listModels();
        return allModels.filter(model => {
            if (model.isPrivate) {
                return false;
            }
            const tags = Array.isArray(model.tags) ? model.tags : [];
            if (tags.includes(CMS_MODEL_SINGLETON_TAG)) {
                return false;
            }
            if (bulkAction.modelIds?.length) {
                return bulkAction.modelIds.includes(model.modelId);
            }
            return true;
        });
    });

    const plugins: CmsGraphQLSchemaPlugin<HcmsBulkActionsContext>[] = [];

    models.forEach(model => {
        const plugin = new CmsGraphQLSchemaPlugin<HcmsBulkActionsContext>({
            typeDefs: /* GraphQL */ `
                     extend enum BulkAction${model.singularApiName}Name {
                        ${BulkActionName.from(bulkAction.name)}
                    }
                `,
            resolvers: {
                Mutation: {
                    [`bulkAction${model.singularApiName}`]: async (_, args, context) => {
                        const canAccess = await context.cms.accessControl.canAccessEntry({
                            model,
                            ...getRequiredAccess(args.action)
                        });
                        if (!canAccess) {
                            return new ErrorResponse(EntryNotAuthorizedError.fromModel(model));
                        }

                        if (args.action === BulkActionName.from("moveToFolder")) {
                            const folderId = args.data?.folderId;
                            if (!folderId) {
                                return new ErrorResponse({
                                    code: "VALIDATION_FAILED",
                                    message: `Missing "data.folderId" in the input.`
                                });
                            }
                            if (!(await canMoveToFolder(context, folderId))) {
                                return new ErrorResponse(EntryNotAuthorizedError.fromModel(model));
                            }
                        }

                        const identity = context.security.getIdentity();

                        const where = await restrictWhere(context, model, args.action, args.where);

                        const response = await context.tasks.trigger({
                            definition: `hcmsBulkList${args.action}Entries`,
                            input: {
                                modelId: model.modelId,
                                where,
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
            // Bulk actions change entries, so they are only part of the manage API.
            isApplicable: context => {
                return context.cms.MANAGE && context.tenancy.getCurrentTenant().id === tenant.id;
            }
        });

        plugin.name = `headless-cms.graphql.schema.bulkAction.${model.modelId}.${bulkAction.name}`;
        plugins.push(plugin);
    });

    context.plugins.register([...plugins]);
};
