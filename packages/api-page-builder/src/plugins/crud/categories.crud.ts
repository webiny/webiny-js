import defaults from "./utils/defaults";
import DataLoader from "dataloader";
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import getPKPrefix from "./utils/getPKPrefix";
import { Category, PbContext } from "@webiny/api-page-builder/types";
import { ContextPlugin } from "@webiny/handler/types";
import { NotAuthorizedError } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";
import { NotFoundError } from "@webiny/handler-graphql";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";

/*withHooks({
    //     async beforeDelete() {
    //         const { PbPage } = context.models;
    //         if (await PbPage.findOne({ query: { category: this.id } })) {
    //             throw new Error("Cannot delete category because some pages are linked to it.");
    //         }
    //     }
    // }),
    */

const CreateDataModel = withFields({
    slug: string({ validation: validation.create("required,minLength:1,maxLength:100") }),
    name: string({ validation: validation.create("required,minLength:1,maxLength:100") }),
    url: string({ validation: validation.create("required,minLength:1,maxLength:100") }),
    layout: string({ validation: validation.create("required,minLength:1,maxLength:100") })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("minLength:1,maxLength:100") }),
    url: string({ validation: validation.create("minLength:1,maxLength:100") }),
    layout: string({ validation: validation.create("minLength:1,maxLength:100") })
})();

const TYPE = "pb.category";
const PERMISSION_NAME = TYPE;

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    apply(context) {
        const { db } = context;
        const PK = () => `${getPKPrefix(context)}C`;

        const categoriesDataLoader = new DataLoader<string, Category>(async slugs => {
            const batch = db.batch();

            for (let i = 0; i < slugs.length; i++) {
                batch.read({
                    ...defaults.db,
                    query: { PK: PK(), SK: slugs[i] }
                });
            }

            const results = await batch.execute();
            return results.map(([response]) => {
                return response[0];
            });
        });

        const { getPermission } = context.security;

        context.pageBuilder = {
            ...context.pageBuilder,
            categories: {
                async get(slug: string) {
                    await context.i18nContent.checkI18NContentPermission();

                    let permission;
                    const categoryPermission = await getPermission("pb.category");
                    if (categoryPermission && hasRwd(categoryPermission, "r")) {
                        permission = categoryPermission;
                    } else {
                        // If we don't have the necessary `categoryPermission` permission, let's still check if the
                        // user has the permission to write pages. If so, we still want to allow listing categories,
                        // because this is needed in order to create a page.
                        const pagePermission = await getPermission("pb.page");
                        if (pagePermission && hasRwd(pagePermission, "w")) {
                            permission = pagePermission;
                        }
                    }

                    if (!permission) {
                        throw new NotAuthorizedError();
                    }

                    const category = await categoriesDataLoader.load(slug);

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, category);

                    return category;
                },
                async list() {
                    await context.i18nContent.checkI18NContentPermission();

                    let permission;
                    const categoryPermission = await getPermission("pb.category");
                    if (categoryPermission && hasRwd(categoryPermission, "r")) {
                        permission = categoryPermission;
                    } else {
                        // If we don't have the necessary `categoryPermission` permission, let's still check if the
                        // user has the permission to write pages. If so, we still want to allow listing categories,
                        // because this is needed in order to create a page.
                        const pagePermission = await getPermission("pb.page");
                        if (pagePermission && hasRwd(pagePermission, "w")) {
                            permission = pagePermission;
                        }
                    }

                    if (!permission) {
                        throw new NotAuthorizedError();
                    }

                    const [categories] = await db.read({
                        ...defaults.db,
                        query: { PK: PK(), SK: { $gt: " " } }
                    });

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (permission.own) {
                        const identity = context.security.getIdentity();
                        return categories.filter(category => category.createdBy.id === identity.id);
                    }

                    return categories;
                },
                async create(data) {
                    await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

                    const existingCategory = await categoriesDataLoader.load(data.slug);
                    if (existingCategory) {
                        throw new NotFoundError(
                            `Category with slug "${data.slug}" already exists.`
                        );
                    }

                    const createDataModel = new CreateDataModel().populate(data);
                    await createDataModel.validate();

                    const identity = context.security.getIdentity();

                    const createData = Object.assign(await createDataModel.toJSON(), {
                        createdOn: new Date().toISOString(),
                        createdBy: {
                            id: identity.id,
                            type: identity.type,
                            displayName: identity.displayName
                        }
                    });

                    await db.create({
                        ...defaults.db,
                        data: {
                            ...createData,
                            PK: PK(),
                            SK: createDataModel.slug,
                            TYPE
                        }
                    });

                    return createData;
                },
                async update(slug, data) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "w"
                    });

                    const category = await this.get(slug);
                    if (!category) {
                        throw new NotFoundError(`Category "${slug}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, category);

                    const updateDataModel = new UpdateDataModel().populate(data);
                    await updateDataModel.validate();

                    const updateData = await updateDataModel.toJSON({ onlyDirty: true });

                    await db.update({
                        ...defaults.db,
                        query: { PK: PK(), SK: slug },
                        data: updateData
                    });

                    return { ...category, ...updateData };
                },
                async delete(slug) {
                    const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                        rwd: "d"
                    });

                    const category = await this.get(slug);
                    if (!category) {
                        throw new NotFoundError(`Category "${slug}" not found.`);
                    }

                    const identity = context.security.getIdentity();
                    checkOwnPermissions(identity, permission, category);

                    await db.delete({
                        ...defaults.db,
                        query: { PK: PK(), SK: slug }
                    });

                    return category;
                }
            }
        };
    }
};

export default plugin;
