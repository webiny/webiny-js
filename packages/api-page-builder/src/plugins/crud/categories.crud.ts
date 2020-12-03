import defaults from "./defaults";
import DataLoader from "dataloader";
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import getPKPrefix from "./utils/getPKPrefix";
import { PbContext } from "@webiny/api-page-builder/types";
import { ContextPlugin } from "@webiny/handler/types";
import { NotAuthorizedError } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";

/*withHooks({
    //     async beforeDelete() {
    //         const { PbPage } = context.models;
    //         if (await PbPage.findOne({ query: { category: this.id } })) {
    //             throw new Error("Cannot delete category because some pages are linked to it.");
    //         }
    //     }
    // }),
    */

export type Category = {
    name: string;
    slug: string;
    url: string;
    layout: string;
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
};

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("minLength:1,maxLength:100") }),
    url: string({ validation: validation.create("minLength:1,maxLength:100") }),
    layout: string({ validation: validation.create("minLength:1,maxLength:100") })
})();

const TYPE = "pb.category";

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    apply(context) {
        const { db } = context;
        const PK_CATEGORY = () => `${getPKPrefix(context)}C`;

        const categoriesDataLoader = new DataLoader<string, Category>(async slugs => {
            const batch = db.batch();

            for (let i = 0; i < slugs.length; i++) {
                batch.read({
                    ...defaults.db,
                    query: { PK: PK_CATEGORY(), SK: slugs[i] }
                });
            }

            const results = await batch.execute();
            return results.map(([response]) => {
                return response[0];
            });
        });

        const { getPermission } = context.security;

        context.categories = {
            async get(slug: string) {
                return categoriesDataLoader.load(slug);
            },
            async list(args) {
                await context.i18nContent.checkI18NContentPermission();

                let permission;

                const categoryPermission = await getPermission("pb.category");
                if (categoryPermission && hasRwd(categoryPermission, "r")) {
                    permission = categoryPermission;
                } else {
                    // If we don't have the necessary `categoryPermission` permission, let's still check if the
                    // user has the permission to create pages. If so, we still want to allow listing categories,
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
                    query: { PK: PK_CATEGORY(), SK: { $gt: " " } },
                    ...args
                });

                // If user can only manage own records, let's check if he owns the loaded one.
                if (permission.own) {
                    const identity = context.security.getIdentity();
                    return categories.filter(category => category.createdBy.id === identity.id);
                }

                return categories;
            },
            create(data) {
                const { name, slug, url, layout, createdOn, createdBy } = data;
                return db.create({
                    ...defaults.db,
                    data: {
                        PK: PK_CATEGORY(),
                        SK: slug,
                        TYPE,
                        name,
                        slug,
                        url,
                        layout,
                        createdOn,
                        createdBy
                    }
                });
            },
            async update(slug, data) {
                const updateData = new UpdateDataModel().populate(data);
                await updateData.validate();

                data = await updateData.toJSON({ onlyDirty: true });

                await db.update({
                    ...defaults.db,
                    query: { PK: PK_CATEGORY(), SK: slug },
                    data
                });

                return data;
            },
            delete(slug: string) {
                return db.delete({
                    ...defaults.db,
                    query: { PK: PK_CATEGORY(), SK: slug }
                });
            }
        };
    }
};

export default plugin;
