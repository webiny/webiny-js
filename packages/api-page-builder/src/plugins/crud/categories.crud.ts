import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import dbArgs from "./dbArgs";
import { HandlerI18NContentContext } from "@webiny/api-i18n-content/types";

export const PK_CATEGORY = "C";

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

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent } = context;
        const PK_CATEGORY = `C#${i18nContent?.locale?.code}`;

        context.categories = {
            async get(slug: string) {
                const [[category]] = await db.read<Category>({
                    ...dbArgs,
                    query: { PK: PK_CATEGORY, SK: slug },
                    limit: 1
                });

                return category;
            },
            async list(args) {
                const [categories] = await db.read<Category>({
                    ...dbArgs,
                    query: { PK: PK_CATEGORY, SK: { $gt: " " } },
                    ...args
                });

                return categories;
            },
            create(data) {
                const { name, slug, url, layout, createdOn, createdBy } = data;
                return db.create({
                    ...dbArgs,
                    data: {
                        PK: PK_CATEGORY,
                        SK: slug,
                        name,
                        slug,
                        url,
                        layout,
                        createdOn,
                        createdBy
                    }
                });
            },
            update(data) {
                const { name, slug, url, layout } = data;
                return db.update({
                    ...dbArgs,
                    query: { PK: PK_CATEGORY, SK: slug },
                    data: {
                        name,
                        slug,
                        url,
                        layout
                    }
                });
            },
            delete(slug: string) {
                return db.delete({
                    ...dbArgs,
                    query: { PK: PK_CATEGORY, SK: slug }
                });
            }
        };
    }
} as HandlerContextPlugin<HandlerI18NContentContext, HandlerContextDb>;
