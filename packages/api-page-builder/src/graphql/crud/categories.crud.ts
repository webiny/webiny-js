import defaults from "./utils/defaults";
import DataLoader from "dataloader";
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import getPKPrefix from "./utils/getPKPrefix";
import { Category, PbContext } from "../../types";
import { ContextPlugin } from "@webiny/handler/types";
import { NotAuthorizedError } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";
import { NotFoundError } from "@webiny/handler-graphql";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import Error from "@webiny/error";

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
    async apply(context) {
        const { db } = context;
        const PK = () => `${getPKPrefix(context)}C`;
        const ES_DEFAULTS = () => defaults.es(context);

        const { getPermission } = context.security;

        context.pageBuilder = {
            ...context.pageBuilder,
            categories: {
                dataLoaders: {
                    get: new DataLoader(async slugs => {
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
                    })
                },
                async get(slug, options = { auth: true }) {
                    const { auth } = options;

                    if (auth === false) {
                        return await this.dataLoaders.get.load(slug);
                    }

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

                    const category = await this.dataLoaders.get.load(slug);

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

                    const [categories] = await db.read<Category>({
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

                    const existingCategory = await this.dataLoaders.get.load(data.slug);
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
                            TYPE,
                            tenant: context.tenancy.getCurrentTenant().id,
                            locale: context.i18nContent.getLocale().code
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

                    // Before deleting, let's check if there is a page that's in this category.
                    // If so, let's prevent this.

                    // Note: this try-catch is here because in tests, we have a case where a page is not created yet.
                    // In that case, this is searching over an index that doesn't exist, and throws an error.
                    // So for that case, if the error is `index_not_found_exception`, then let's just ignore it.
                    try {
                        const filter: any = [{ term: { "category.keyword": category.slug } }];

                        // When ES index is shared between tenants, we need to filter records by tenant ID
                        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
                        if (sharedIndex) {
                            const tenant = context.tenancy.getCurrentTenant();
                            filter.push({ term: { "tenant.keyword": tenant.id } });
                        }

                        const response = await context.elasticSearch.search({
                            ...ES_DEFAULTS(),
                            body: {
                                size: 1,
                                query: {
                                    bool: {
                                        filter
                                    }
                                }
                            }
                        });

                        const results = response.body.hits;
                        const total = results.total.value;

                        if (total) {
                            throw new Error(
                                "Cannot delete category because some pages are linked to it.",
                                "CANNOT_DELETE_CATEGORY_PAGE_EXISTING"
                            );
                        }
                    } catch (e) {
                        if (process.env.NODE_ENV !== "test") {
                            throw e;
                        }

                        if (e.message !== "index_not_found_exception") {
                            throw e;
                        }
                    }

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
