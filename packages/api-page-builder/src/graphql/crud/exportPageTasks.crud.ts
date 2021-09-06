import { ContextPlugin } from "@webiny/handler/types";
import mdbid from "mdbid";
import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import defaults from "./utils/defaults";
import getPKPrefix from "./utils/getPKPrefix";
import { ExportTaskStatus, ExportPageTask, PbContext } from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";

const validStatus = `${ExportTaskStatus.PENDING}:${ExportTaskStatus.PROCESSING}:${ExportTaskStatus.COMPLETED}:${ExportTaskStatus.FAILED}`;

const CreateDataModel = withFields({
    status: string({
        validation: validation.create(`required,in:${validStatus}`)
    }),
    data: object()
})();

const UpdateDataModel = withFields({
    status: string({
        validation: validation.create(`in:${validStatus}`)
    }),
    data: object()
})();

const TYPE = "pb.exportPageTask";
const PERMISSION_NAME = "pb.page";
const PAGE_EXPORT_TASK = "PET";

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    async apply(context) {
        const { db } = context;

        const PK = () => `${getPKPrefix(context)}${PAGE_EXPORT_TASK}`;

        context.pageBuilder = {
            ...context.pageBuilder,
            exportPageTask: {
                async get(id) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });

                    const [[exportPageTask]] = await db.read<ExportPageTask>({
                        ...defaults.db,
                        query: { PK: PK(), SK: id },
                        limit: 1
                    });

                    if (!exportPageTask) {
                        return null;
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, exportPageTask);

                    return exportPageTask;
                },

                async list() {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });

                    const [exportPageTasks] = await db.read<ExportPageTask>({
                        ...defaults.db,
                        query: { PK: PK(), SK: { $gt: " " } }
                    });

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (permission.own) {
                        const identity = context.security.getIdentity();
                        return exportPageTasks.filter(item => item.createdBy.id === identity.id);
                    }

                    return exportPageTasks;
                },

                async create(data) {
                    await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

                    const createDataModel = new CreateDataModel().populate(data);
                    await createDataModel.validate();

                    const id = mdbid();
                    const identity = context.security.getIdentity();

                    const createData = Object.assign(await createDataModel.toJSON(), {
                        PK: PK(),
                        SK: id,
                        TYPE,
                        tenant: context.tenancy.getCurrentTenant().id,
                        locale: context.i18nContent.getLocale().code,
                        id,
                        createdOn: new Date().toISOString(),
                        createdBy: {
                            id: identity.id,
                            type: identity.type,
                            displayName: identity.displayName
                        }
                    });

                    await db.create({ ...defaults.db, data: createData });

                    return createData;
                },

                async update(id, data) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "w"
                    });
                    const exportPageTask = await this.get(id);
                    if (!exportPageTask) {
                        throw new NotFoundError(`ExportPageTask "${id}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, exportPageTask);

                    const updateDataModel = new UpdateDataModel().populate(data);
                    await updateDataModel.validate();

                    const updateData = await updateDataModel.toJSON({ onlyDirty: true });

                    await db.update({
                        ...defaults.db,
                        query: { PK: PK(), SK: id },
                        data: updateData
                    });

                    return { ...exportPageTask, ...updateData };
                },

                async delete(id) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "d"
                    });

                    const exportPageTask = await this.get(id);
                    if (!exportPageTask) {
                        throw new NotFoundError(`ExportPageTask "${id}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, exportPageTask);

                    await db.delete({
                        ...defaults.db,
                        query: { PK: PK(), SK: id }
                    });

                    return exportPageTask;
                }
            }
        };
    }
};

export default plugin;
