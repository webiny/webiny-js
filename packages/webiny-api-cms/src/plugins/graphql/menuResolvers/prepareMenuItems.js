// @flow
import { Entity } from "webiny-entity";
import { cloneDeep } from "lodash";
import listPublishedPagesSql from "../pageResolvers/listPublishedPages.sql";

const applyCleanup = async items => {
    if (!Array.isArray(items)) {
        return;
    }

    for (let i = 0; i < items.length; i++) {
        if (items[i].__cleanup__) {
            items.splice(i, 1);
            i--;
            continue;
        }

        const { title, children, url, id, type } = items[i];
        items[i] = { title, url, children, id, type };

        await applyCleanup(items[i].children);
    }
};

const applyModifier = async ({ items, modifier, context }) => {
    if (!Array.isArray(items)) {
        return;
    }

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        await modifier({ item, context });

        await applyModifier({ items: item.children, modifier, context });
    }
};

const prepareItems = async ({
    items,
    modifiers,
    context = {}
}: {
    items: ?Array<Object>,
    modifiers: Array<Function>,
    context?: Object
}) => {
    for (let i = 0; i < modifiers.length; i++) {
        let modifier = modifiers[i];
        await applyModifier({ items, modifier, context });
    }

    // Cleanup empty items.
    await applyCleanup(items);
};

export default async ({ entity: menu, context: graphqlContext }: Object) => {
    const items = cloneDeep(menu.items);

    // Each modifier is recursively applied to all items.
    await prepareItems({
        items,
        modifiers: [
            ({ item, context }) => {
                switch (item.type) {
                    case "cms-menu-item-page": {
                        if (!context.distinctPages) {
                            context.distinctPages = {
                                loaded: false,
                                data: {}
                            };
                        }

                        if (Entity.isId(item.page) && !context.distinctPages.data[item.page]) {
                            context.distinctPages.data[item.page] = null;
                        }
                        break;
                    }
                }
            },
            async ({ context, item }) => {
                switch (item.type) {
                    case "cms-menu-item-page": {
                        if (!context.distinctPages.loaded) {
                            const ids = Object.keys(context.distinctPages.data);

                            const sql = `SELECT id, title, url FROM Cms_Pages WHERE deleted = 0 AND published = 1 AND id IN (${ids
                                .map(() => "?")
                                .join(",")})`;

                            await Entity.getDriver()
                                .getConnection()
                                .query(sql, ids)
                                .then(results => {
                                    for (let i = 0; i < results.length; i++) {
                                        let result = results[i];
                                        context.distinctPages.data[result.id] = result;
                                    }
                                });
                        }

                        const page = context.distinctPages.data[item.page];
                        if (page) {
                            Object.assign(item, page);
                        } else {
                            item.__cleanup__ = true;
                        }

                        break;
                    }
                    case "cms-menu-item-page-list": {
                        const { category, sortBy, sortDir } = item;

                        const sql = await listPublishedPagesSql(
                            { category, sort: { [sortBy]: sortDir } },
                            graphqlContext
                        );

                        item.children = await Entity.getDriver()
                            .getConnection()
                            .query(sql.query, sql.values);

                        break;
                    }
                }
            }
        ]
    });

    return items;
};
