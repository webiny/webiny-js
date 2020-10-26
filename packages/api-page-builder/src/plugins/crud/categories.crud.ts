import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import keys from "./keys";

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
};

export default {
    type: "context",
    apply(context) {
        const { db } = context;
        context.categories = {
            async get(slug: string) {
                const [[category]] = await db.read<Category>({
                    keys,
                    query: { PK: PK_CATEGORY, SK: slug },
                    limit: 1
                });

                return category;
            },
            async list(args) {
                const [categories] = await db.read<Category>({
                    keys,
                    query: { PK: PK_CATEGORY, SK: { $gt: " " } },
                    ...args
                });

                return categories;
            },
            create(data) {
                const { name, slug, url, layout } = data;
                return db.create({
                    data: {
                        PK: PK_CATEGORY,
                        SK: slug,
                        name,
                        slug,
                        url,
                        layout
                    }
                });
            },
            update(data) {
                const { name, slug, url, layout } = data;
                return db.update({
                    keys,
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
                    keys,
                    query: { PK: PK_CATEGORY, SK: slug }
                });
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb>;
