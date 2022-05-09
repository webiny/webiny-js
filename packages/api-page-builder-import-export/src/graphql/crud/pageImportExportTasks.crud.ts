/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { string, withFields } from "@commodo/fields";
/**
 * Package commodo-fields-object does not have types.
 */
// @ts-ignore
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import { ContextPlugin } from "@webiny/handler";
import checkBasePermissions from "@webiny/api-page-builder/graphql/crud/utils/checkBasePermissions";
import checkOwnPermissions from "@webiny/api-page-builder/graphql/crud/utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    PageImportExportPluginsParams,
    PageImportExportTask,
    PageImportExportTaskStatus,
    PageImportExportTaskStorageOperationsListSubTaskParams
} from "~/types";
import { PbPageImportExportContext } from "~/graphql/types";
import WebinyError from "@webiny/error";
import { PageElementStorageOperationsListParams } from "@webiny/api-page-builder/types";

const validStatus = `${PageImportExportTaskStatus.PENDING}:${PageImportExportTaskStatus.PROCESSING}:${PageImportExportTaskStatus.COMPLETED}:${PageImportExportTaskStatus.FAILED}`;

const CreateDataModel = withFields({
    status: string({
        validation: validation.create(`required,in:${validStatus}`)
    }),
    data: object(),
    input: object(),
    stats: object(),
    error: object()
})();

const UpdateDataModel = withFields({
    status: string({
        validation: validation.create(`in:${validStatus}`)
    }),
    data: object(),
    input: object(),
    stats: object(),
    error: object()
})();

const PERMISSION_NAME = "pb.page";

export default ({ storageOperations }: PageImportExportPluginsParams) =>
    new ContextPlugin<PbPageImportExportContext>(async context => {
        /**
         * If pageBuilder is not defined on the context, do not continue, but log it.
         */
        if (!context.pageBuilder) {
            console.log("Missing pageBuilder on context. Skipping Page ImportExportTasks crud.");
            return;
        }

        const getLocale = () => {
            const locale = context.i18n.getContentLocale();
            if (!locale) {
                throw new WebinyError(
                    "Missing content locale in pageImportExportTasks.crud.ts",
                    "LOCALE_ERROR"
                );
            }
            return locale;
        };

        // Modify context
        context.pageBuilder.pageImportExportTask = {
            storageOperations,
            async getTask(id) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "r"
                });

                const tenant = context.tenancy.getCurrentTenant();
                const locale = getLocale();

                const params = {
                    where: {
                        tenant: tenant.id,
                        locale: locale.code,
                        id
                    }
                };

                let pageImportExportTask: PageImportExportTask | null = null;

                try {
                    pageImportExportTask = await storageOperations.getTask(params);

                    if (!pageImportExportTask) {
                        return null;
                    }
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not get pageImportExportTask by id.",
                        ex.code || "GET_PAGE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            params
                        }
                    );
                }
                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, pageImportExportTask);

                return pageImportExportTask;
            },

            async listTasks(params) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "r"
                });

                const tenant = context.tenancy.getCurrentTenant();
                const locale = getLocale();

                const { sort, limit } = params || {};

                const listParams: PageElementStorageOperationsListParams = {
                    where: {
                        tenant: tenant.id,
                        locale: locale.code
                    },
                    sort: Array.isArray(sort) && sort.length > 0 ? sort : ["createdOn_ASC"],
                    limit: limit
                };

                // If user can only manage own records, let's add that to the listing.
                if (permission.own) {
                    const identity = context.security.getIdentity();
                    listParams.where.createdBy = identity.id;
                }

                try {
                    const [items] = await storageOperations.listTasks(listParams);
                    return items;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not list all page elements.",
                        ex.code || "LIST_PAGE_ELEMENTS_ERROR",
                        {
                            params
                        }
                    );
                }
            },

            async createTask(input) {
                await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

                const createDataModel = new CreateDataModel().populate(input);
                await createDataModel.validate();

                const id: string = mdbid();
                const identity = context.security.getIdentity();

                const data: PageImportExportTask = await createDataModel.toJSON();

                const pageImportExportTask: PageImportExportTask = {
                    ...data,
                    tenant: context.tenancy.getCurrentTenant().id,
                    locale: getLocale().code,
                    id,
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        type: identity.type,
                        displayName: identity.displayName
                    }
                };

                try {
                    return await storageOperations.createTask({
                        input: data,
                        task: pageImportExportTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not create pageImportExportTask.",
                        ex.code || "CREATE_PAGE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            pageImportExportTask
                        }
                    );
                }
            },

            async updateTask(id, input) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "w"
                });
                const original = await context.pageBuilder.pageImportExportTask.getTask(id);
                if (!original) {
                    throw new NotFoundError(`PageImportExportTask "${id}" not found.`);
                }

                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, original);

                const updateDataModel = new UpdateDataModel().populate(input);
                await updateDataModel.validate();

                const data = await updateDataModel.toJSON({ onlyDirty: true });

                const pageImportExportTask: PageImportExportTask = {
                    ...original,
                    ...data
                };

                try {
                    return await storageOperations.updateTask({
                        input: data,
                        original,
                        task: pageImportExportTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update pageImportExportTask.",
                        ex.code || "UPDATE_PAGE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            original,
                            pageImportExportTask
                        }
                    );
                }
            },

            async deleteTask(id) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "d"
                });

                const pageImportExportTask = await context.pageBuilder.pageImportExportTask.getTask(
                    id
                );
                if (!pageImportExportTask) {
                    throw new NotFoundError(`PageImportExportTask "${id}" not found.`);
                }

                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, pageImportExportTask);

                try {
                    return await storageOperations.deleteTask({
                        task: pageImportExportTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not delete pageImportExportTask.",
                        ex.code || "DELETE_PAGE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            pageImportExportTask
                        }
                    );
                }
            },

            async updateStats(id, input) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "w"
                });
                const original = await context.pageBuilder.pageImportExportTask.getTask(id);
                if (!original) {
                    throw new NotFoundError(`PageImportExportTask "${id}" not found.`);
                }

                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, original);

                try {
                    return await storageOperations.updateTaskStats({
                        input,
                        original
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update pageImportExportTask.",
                        ex.code || "UPDATE_PAGE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            original
                        }
                    );
                }
            },

            async createSubTask(parent, id, input) {
                await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

                const createDataModel = new CreateDataModel().populate(input);
                await createDataModel.validate();

                const identity = context.security.getIdentity();

                const data = await createDataModel.toJSON();

                const pageImportExportSubTask: PageImportExportTask = {
                    ...data,
                    tenant: context.tenancy.getCurrentTenant().id,
                    locale: getLocale().code,
                    id: id,
                    parent: parent,
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        type: identity.type,
                        displayName: identity.displayName
                    }
                };

                try {
                    return await storageOperations.createSubTask({
                        input: data,
                        subTask: pageImportExportSubTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not create pageImportExportSubTask.",
                        ex.code || "CREATE_PAGE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            pageImportExportSubTask
                        }
                    );
                }
            },

            async updateSubTask(parent, subTaskId, input) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "w"
                });
                const original = await context.pageBuilder.pageImportExportTask.getSubTask(
                    parent,
                    subTaskId
                );
                if (!original) {
                    throw new NotFoundError(
                        `PageImportExportTask parent: "${parent}" and id: "${subTaskId}" not found.`
                    );
                }

                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, original);

                const updateDataModel = new UpdateDataModel().populate(input);
                await updateDataModel.validate();

                const data = await updateDataModel.toJSON({ onlyDirty: true });
                // TODO: Merge recursively
                const pageImportExportSubTask: PageImportExportTask = {
                    ...original,
                    ...data
                };

                try {
                    return await storageOperations.updateSubTask({
                        input: data,
                        original,
                        subTask: pageImportExportSubTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update pageImportExportSubTask.",
                        ex.code || "UPDATE_PAGE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            pageImportExportSubTask,
                            original
                        }
                    );
                }
            },

            async getSubTask(parent, subTaskId) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "r"
                });
                const tenant = context.tenancy.getCurrentTenant();
                const locale = getLocale();

                const params = {
                    where: {
                        tenant: tenant.id,
                        locale: locale.code,
                        id: subTaskId,
                        parent: parent
                    }
                };

                let pageImportExportSubTask: PageImportExportTask | null = null;

                try {
                    pageImportExportSubTask = await storageOperations.getSubTask(params);
                    if (!pageImportExportSubTask) {
                        return null;
                    }
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not get pageImportExportSubTask by id.",
                        ex.code || "GET_PAGE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            params
                        }
                    );
                }

                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, pageImportExportSubTask);

                return pageImportExportSubTask;
            },

            async listSubTasks(parent, status, limit) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "r"
                });

                const tenant = context.tenancy.getCurrentTenant();
                const locale = getLocale();

                const listParams: PageImportExportTaskStorageOperationsListSubTaskParams = {
                    where: {
                        tenant: tenant.id,
                        locale: locale.code,
                        parent: parent,
                        status
                    },
                    limit
                };

                // If user can only manage own records, let's add that to the listing.
                if (permission.own) {
                    const identity = context.security.getIdentity();
                    listParams.where.createdBy = identity.id;
                }

                try {
                    const [items] = await storageOperations.listSubTasks(listParams);
                    return items;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not list all pageImportExportSubTask.",
                        ex.code || "LIST_PAGE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            params: {
                                parent,
                                status,
                                limit
                            }
                        }
                    );
                }
            }
        };
    });
