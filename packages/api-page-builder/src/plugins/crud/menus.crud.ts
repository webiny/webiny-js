import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import keys from "./keys";

export const PK_MENU = "M";

export type Menu = {
    title: string;
    slug: string;
    description: string;
    items: Record<string, any>;
};

export default {
    type: "context",
    apply(context) {
        const { db } = context;
        context.menus = {
            async get(slug: string) {
                const [[menu]] = await db.read<Menu>({
                    keys,
                    query: { PK: PK_MENU, SK: slug },
                    limit: 1
                });

                return menu;
            },
            async list(args) {
                const [menus] = await db.read<Menu>({
                    keys,
                    query: { PK: PK_MENU, SK: { $gt: " " } },
                    ...args
                });

                return menus;
            },
            create(data) {
                const { title, slug, description, items, createdBy } = data;
                return db.create({
                    data: {
                        PK: PK_MENU,
                        SK: slug,
                        title,
                        slug,
                        description,
                        items,
                        createdBy
                    }
                });
            },
            update(data) {
                const { title, slug, description, items } = data;
                return db.update({
                    keys,
                    query: { PK: PK_MENU, SK: slug },
                    data: {
                        title,
                        slug,
                        description,
                        items
                    }
                });
            },
            delete(slug: string) {
                return db.delete({
                    keys,
                    query: { PK: PK_MENU, SK: slug }
                });
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb>;
