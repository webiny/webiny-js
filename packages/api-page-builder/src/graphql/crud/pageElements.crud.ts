import { ContextPlugin } from "@webiny/handler/types";
import mdbid from "mdbid";
import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import defaults from "./utils/defaults";
import getPKPrefix from "./utils/getPKPrefix";
import { PageElement, PbContext } from "../../types";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";

const CreateDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    type: string({ validation: validation.create("required,in:element:block") }),
    category: string({ validation: validation.create("required,maxLength:100") }),
    content: object({ validation: validation.create("required") }),
    preview: object({ validation: validation.create("required") })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    type: string({ validation: validation.create("in:element:block") }),
    category: string({ validation: validation.create("maxLength:100") }),
    content: object(),
    preview: object()
})();

const TYPE = "pb.pageElement";
const PERMISSION_NAME = "pb.page";

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    async apply(context) {
        const { db } = context;

        const PK = () => `${getPKPrefix(context)}PE`;

        context.pageBuilder = {
            ...context.pageBuilder,
            pageElements: {
                async get(id) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });

                    const [[pageElement]] = await db.read<PageElement>({
                        ...defaults.db,
                        query: { PK: PK(), SK: id },
                        limit: 1
                    });

                    if (!pageElement) {
                        return null;
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, pageElement);

                    return pageElement;
                },

                async list() {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "r"
                    });

                    const [pageElements] = await db.read<PageElement>({
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
                    const pageElement = await this.get(id);
                    if (!pageElement) {
                        throw new NotFoundError(`Page element "${id}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, pageElement);

                    const updateDataModel = new UpdateDataModel().populate(data);
                    await updateDataModel.validate();

                    const updateData = await updateDataModel.toJSON({ onlyDirty: true });

                    await db.update({
                        ...defaults.db,
                        query: { PK: PK(), SK: id },
                        data: updateData
                    });

                    return { ...pageElement, ...updateData };
                },

                async delete(slug) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "d"
                    });

                    const pageElement = await this.get(slug);
                    if (!pageElement) {
                        throw new NotFoundError(`PageElement "${slug}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, pageElement);

                    await db.delete({
                        ...defaults.db,
                        query: { PK: PK(), SK: slug }
                    });

                    return pageElement;
                }
            }
        };
    }
};

export default plugin;
