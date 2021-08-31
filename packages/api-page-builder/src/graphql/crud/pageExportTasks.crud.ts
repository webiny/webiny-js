import { ContextPlugin } from "@webiny/handler/types";
import mdbid from "mdbid";
import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import defaults from "./utils/defaults";
import getPKPrefix from "./utils/getPKPrefix";
import { ExportTaskStatus, PageExportTask, PbContext } from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";

const CreateDataModel = withFields({
    status: string({
        validation: validation.create(
            `required,in:${ExportTaskStatus.PENDING}:${ExportTaskStatus.PROCESSING}:${ExportTaskStatus.COMPLETED}`
        )
    }),
    data: object()
})();

const UpdateDataModel = withFields({
    status: string({
        validation: validation.create(
            `in:${ExportTaskStatus.PENDING}:${ExportTaskStatus.PROCESSING}:${ExportTaskStatus.COMPLETED}`
        )
    }),
    data: object()
})();

const TYPE = "pb.pageExportTask";
const PERMISSION_NAME = "pb.page";
const PAGE_EXPORT_TASK = "PET";

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    async apply(context) {
        const { db } = context;

        const PK = () => `${getPKPrefix(context)}${PAGE_EXPORT_TASK}`;

        context.pageBuilder = {
            ...context.pageBuilder,
            pageExportTask: {
                async get(id) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });

                    const [[pageExportTask]] = await db.read<PageExportTask>({
                        ...defaults.db,
                        query: { PK: PK(), SK: id },
                        limit: 1
                    });

                    if (!pageExportTask) {
                        return null;
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, pageExportTask);

                    return pageExportTask;
                },

                async list() {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });

                    const [pageElements] = await db.read<PageExportTask>({
                        ...defaults.db,
                        query: { PK: PK(), SK: { $gt: " " } }
                    });

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (permission.own) {
                        const identity = context.security.getIdentity();
                        return pageElements.filter(item => item.createdBy.id === identity.id);
                    }

                    return pageElements;
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
                    const pageExportTask = await this.get(id);
                    if (!pageExportTask) {
                        throw new NotFoundError(`PageExportTask "${id}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, pageExportTask);

                    const updateDataModel = new UpdateDataModel().populate(data);
                    await updateDataModel.validate();

                    const updateData = await updateDataModel.toJSON({ onlyDirty: true });

                    await db.update({
                        ...defaults.db,
                        query: { PK: PK(), SK: id },
                        data: updateData
                    });

                    return { ...pageExportTask, ...updateData };
                },

                async delete(id) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "d"
                    });

                    const pageExportTask = await this.get(id);
                    if (!pageExportTask) {
                        throw new NotFoundError(`PageExportTask "${id}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, pageExportTask);

                    await db.delete({
                        ...defaults.db,
                        query: { PK: PK(), SK: id }
                    });

                    return pageExportTask;
                }
            }
        };
    }
};

export default plugin;
