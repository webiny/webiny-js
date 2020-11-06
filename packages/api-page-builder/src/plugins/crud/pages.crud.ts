import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import dbArgs from "./dbArgs";
import { HandlerI18NContentContext } from "@webiny/api-i18n-content/types";

export type Page = {
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
        const PK_PAGE = `M#${i18nContent?.locale?.code}`;

        context.pages = {
            async get(slug: string) {
                const [[page]] = await db.read<Page>({
                    ...dbArgs,
                    query: { PK: PK_PAGE, SK: slug },
                    limit: 1
                });

                return page;
            },
            async list(args) {
                const [pages] = await db.read<Page>({
                    ...dbArgs,
                    query: { PK: PK_PAGE, SK: { $gt: " " } },
                    ...args
                });

                return pages;
            },
            async create(data) {
                const { title, slug, description, items, createdBy, createdOn } = data;

                return db.create({
                    ...dbArgs,
                    data: {
                        PK: PK_PAGE,
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
                    ...dbArgs,
                    query: { PK: PK_PAGE, SK: slug },
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
                    ...dbArgs,
                    query: { PK: PK_PAGE, SK: slug }
                });
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb, HandlerI18NContentContext>;
