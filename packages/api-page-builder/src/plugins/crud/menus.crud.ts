import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import defaults from "./defaults";
import { HandlerI18NContentContext } from "@webiny/api-i18n-content/types";

export type Menu = {
    title: string;
    slug: string;
    description: string;
    items: Record<string, any>;
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
        const PK_MENU = `M#${i18nContent?.locale?.code}`;

        context.menus = {
            async get(slug: string) {
                const [[menu]] = await db.read<Menu>({
                    ...defaults.db,
                    query: { PK: PK_MENU, SK: slug },
                    limit: 1
                });

                return menu;
            },
            async list(args) {
                const [menus] = await db.read<Menu>({
                    ...defaults.db,
                    query: { PK: PK_MENU, SK: { $gt: " " } },
                    ...args
                });

                return menus;
            },
            async create(data) {
                const { title, slug, description, items, createdBy, createdOn } = data;

                return db.create({
                    ...defaults.db,
                    data: {
                        PK: PK_MENU,
                        SK: slug,
                        title,
                        slug,
                        description,
                        items,
                        createdOn,
                        createdBy
                    }
                });
            },
            update(data) {
                const { title, slug, description, items } = data;
                return db.update({
                    ...defaults.db,
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
                    ...defaults.db,
                    query: { PK: PK_MENU, SK: slug }
                });
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb, HandlerI18NContentContext>;
