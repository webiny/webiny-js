import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import {
    Category,
    CategoryStorageOperations,
    CategoryStorageOperationsGetParams,
    CategoryStorageOperationsListParams,
    PbContext
} from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { NotAuthorizedError } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";
import { NotFoundError } from "@webiny/handler-graphql";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import WebinyError from "@webiny/error";
import { CategoryStorageOperationsProviderPlugin } from "~/plugins/CategoryStorageOperationsProviderPlugin";
import { createStorageOperations } from "./storageOperations";

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

const PERMISSION_NAME = "pb.category";

export default new ContextPlugin<PbContext>(async context => {
    /**
     * If pageBuilder is not defined on the context, do not continue, but log it.
     */
    if (!context.pageBuilder) {
        console.log("Missing pageBuilder on context. Skipping Categories crud.");
        return;
    }

    const storageOperations = await createStorageOperations<CategoryStorageOperations>(
        context,
        CategoryStorageOperationsProviderPlugin.type
    );

    const { getPermission } = context.security;

    context.pageBuilder.categories = {
        async get(slug, options = { auth: true }) {
            const { auth } = options;

            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18nContent.getLocale();
            const params: CategoryStorageOperationsGetParams = {
                where: {
                    slug,
                    tenant: tenant.id,
                    locale: locale.code
                }
            };

            if (auth === false) {
                return await storageOperations.get(params);
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

            let category: Category;
            try {
                category = await storageOperations.get(params);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load category by slug.",
                    ex.code || "GET_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }

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

            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18nContent.getLocale();

            const params: CategoryStorageOperationsListParams = {
                where: {
                    tenant: tenant.id,
                    locale: locale.code
                },
                sort: ["createdOn_DESC"]
            };
            // If user can only manage own records, add the createdBy to where values.
            if (permission.own) {
                const identity = context.security.getIdentity();

                params.where.createdBy = identity.id;
            }

            try {
                const [items] = await storageOperations.list(params);
                return items;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list categories by given params.",
                    ex.code || "LIST_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }
        },
        async create(input) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const existingCategory = await this.dataLoaders.get.load(input.slug);
            if (existingCategory) {
                throw new NotFoundError(`Category with slug "${input.slug}" already exists.`);
            }

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const identity = context.security.getIdentity();

            const data: Category = await createDataModel.toJSON();

            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18nContent.getLocale();

            const category: Category = {
                ...data,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                },
                tenant: tenant.id,
                locale: locale.code
            };

            try {
                return await storageOperations.create({
                    input: data,
                    category
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create category.",
                    ex.code || "CREATE_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        category
                    }
                );
            }
        },
        async update(slug, input) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            const original = await this.get(slug);
            if (!original) {
                throw new NotFoundError(`Category "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original);

            const updateDataModel = new UpdateDataModel().populate(input);
            await updateDataModel.validate();

            const data = await updateDataModel.toJSON({ onlyDirty: true });

            const category: Category = {
                ...original,
                ...data
            };
            try {
                return await storageOperations.update({
                    input: data,
                    original,
                    category
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update category.",
                    ex.code || "UPDATE_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        category
                    }
                );
            }
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
            const [pages] = await context.pageBuilder.pages.listLatest({
                where: {
                    category: category.slug
                },
                limit: 1
            });
            if (pages.length > 0) {
                throw new WebinyError(
                    "Cannot delete category because some pages are linked to it.",
                    "CANNOT_DELETE_CATEGORY_PAGE_EXISTING"
                );
            }

            /*
            
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

                const response = await context.elasticsearch.search({
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
                    throw new WebinyError(
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
            */

            try {
                return await storageOperations.delete({
                    category
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete category.",
                    ex.code || "DELETE_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        category
                    }
                );
            }
        }
    };
});
