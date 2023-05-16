import { mdbid } from "@webiny/utils";
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
import { ContextPlugin } from "@webiny/api";
import checkBasePermissions from "@webiny/api-page-builder/graphql/crud/utils/checkBasePermissions";
import checkOwnPermissions from "@webiny/api-page-builder/graphql/crud/utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    ImportExportPluginsParams,
    ImportExportTask,
    ImportExportTaskStatus,
    ImportExportTaskStorageOperationsListSubTaskParams
} from "~/types";
import { PbImportExportContext } from "~/graphql/types";
import WebinyError from "@webiny/error";
import { PageElementStorageOperationsListParams } from "@webiny/api-page-builder/types";

const validStatus = `${ImportExportTaskStatus.PENDING}:${ImportExportTaskStatus.PROCESSING}:${ImportExportTaskStatus.COMPLETED}:${ImportExportTaskStatus.FAILED}`;

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

export default ({ storageOperations }: ImportExportPluginsParams) =>
    new ContextPlugin<PbImportExportContext>(async context => {
        /**
         * If pageBuilder is not defined on the context, do not continue, but log it.
         */
        if (!context.pageBuilder) {
            console.log("Missing pageBuilder on context. Skipping  ImportExportTasks crud.");
            return;
        }

        const getLocale = () => {
            const locale = context.i18n.getContentLocale();
            if (!locale) {
                throw new WebinyError(
                    "Missing content locale in importExportTasks.crud.ts",
                    "LOCALE_ERROR"
                );
            }
            return locale;
        };

        // Modify context
        context.pageBuilder.importExportTask = {
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

                let importExportTask: ImportExportTask | null = null;

                try {
                    importExportTask = await storageOperations.getTask(params);

                    if (!importExportTask) {
                        return null;
                    }
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not get importExportTask by id.",
                        ex.code || "GET_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            params
                        }
                    );
                }
                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, importExportTask);

                return importExportTask;
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
                        ex.message || "Could not list all importExportTask.",
                        ex.code || "LIST_ELEMENTS_ERROR",
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

                const data: ImportExportTask = await createDataModel.toJSON();

                const importExportTask: ImportExportTask = {
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
                        task: importExportTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not create importExportTask.",
                        ex.code || "CREATE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            importExportTask
                        }
                    );
                }
            },

            async updateTask(id, input) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "w"
                });
                const original = await context.pageBuilder.importExportTask.getTask(id);
                if (!original) {
                    throw new NotFoundError(`ImportExportTask "${id}" not found.`);
                }

                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, original);

                const updateDataModel = new UpdateDataModel().populate(input);
                await updateDataModel.validate();

                const data = await updateDataModel.toJSON({ onlyDirty: true });

                const importExportTask: ImportExportTask = {
                    ...original,
                    ...data
                };

                try {
                    return await storageOperations.updateTask({
                        input: data,
                        original,
                        task: importExportTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update importExportTask.",
                        ex.code || "UPDATE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            original,
                            importExportTask
                        }
                    );
                }
            },

            async deleteTask(id) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "d"
                });

                const importExportTask = await context.pageBuilder.importExportTask.getTask(id);
                if (!importExportTask) {
                    throw new NotFoundError(`ImportExportTask "${id}" not found.`);
                }

                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, importExportTask);

                try {
                    return await storageOperations.deleteTask({
                        task: importExportTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not delete importExportTask.",
                        ex.code || "DELETE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            importExportTask
                        }
                    );
                }
            },

            async updateStats(id, input) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "w"
                });
                const original = await context.pageBuilder.importExportTask.getTask(id);
                if (!original) {
                    throw new NotFoundError(`ImportExportTask "${id}" not found.`);
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
                        ex.message || "Could not update importExportTask.",
                        ex.code || "UPDATE_IMPORT_EXPORT_TASK_ERROR",
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

                const importExportSubTask: ImportExportTask = {
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
                        subTask: importExportSubTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not create importExportSubTask.",
                        ex.code || "CREATE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            importExportSubTask
                        }
                    );
                }
            },

            async updateSubTask(parent, subTaskId, input) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "w"
                });
                const original = await context.pageBuilder.importExportTask.getSubTask(
                    parent,
                    subTaskId
                );
                if (!original) {
                    throw new NotFoundError(
                        `ImportExportTask parent: "${parent}" and id: "${subTaskId}" not found.`
                    );
                }

                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, original);

                const updateDataModel = new UpdateDataModel().populate(input);
                await updateDataModel.validate();

                const data = await updateDataModel.toJSON({ onlyDirty: true });
                // TODO: Merge recursively
                const importExportSubTask: ImportExportTask = {
                    ...original,
                    ...data
                };

                try {
                    return await storageOperations.updateSubTask({
                        input: data,
                        original,
                        subTask: importExportSubTask
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update importExportSubTask.",
                        ex.code || "UPDATE_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            importExportSubTask,
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

                let importExportSubTask: ImportExportTask | null = null;

                try {
                    importExportSubTask = await storageOperations.getSubTask(params);
                    if (!importExportSubTask) {
                        return null;
                    }
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not get importExportSubTask by id.",
                        ex.code || "GET_IMPORT_EXPORT_TASK_ERROR",
                        {
                            ...(ex.data || {}),
                            params
                        }
                    );
                }

                const identity = context.security.getIdentity();
                checkOwnPermissions(identity, permission, importExportSubTask);

                return importExportSubTask;
            },

            async listSubTasks(parent, status, limit) {
                const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "r"
                });

                const tenant = context.tenancy.getCurrentTenant();
                const locale = getLocale();

                const listParams: ImportExportTaskStorageOperationsListSubTaskParams = {
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
                        ex.message || "Could not list all importExportSubTask.",
                        ex.code || "LIST_IMPORT_EXPORT_TASK_ERROR",
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
