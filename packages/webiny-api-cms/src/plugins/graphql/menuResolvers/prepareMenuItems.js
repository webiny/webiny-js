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
                        if (!context.distinctParents) {
                            context.distinctParents = {
                                loaded: false,
                                data: {}
                            };
                        }

                        // "item.page" actually represents "parent" value. This is because once we have parent, we can
                        // more easily load the right child page (we just need to search published pages in this case).
                        if (Entity.isId(item.page) && !context.distinctParents.data[item.page]) {
                            context.distinctParents.data[item.page] = null;
                        }
                        break;
                    }
                }
            },
            async ({ context, item }) => {
                switch (item.type) {
                    case "cms-menu-item-page": {
                        if (!context.distinctParents.loaded) {
                            const ids = Object.keys(context.distinctParents.data);

                            const sql = await listPublishedPagesSql(
                                { parent: ids },
                                graphqlContext
                            );

                            await Entity.getDriver()
                                .getConnection()
                                .query(sql.query, sql.values)
                                .then(results => {
                                    for (let i = 0; i < results.length; i++) {
                                        let { title, url, parent: id } = results[i];
                                        context.distinctParents.data[id] = { id, title, url };
                                    }
                                });
                        }

                        const page = context.distinctParents.data[item.page];
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
