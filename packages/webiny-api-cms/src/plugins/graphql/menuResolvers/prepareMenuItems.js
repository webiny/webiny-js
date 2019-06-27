// @flow
import { Entity } from "webiny-entity";
import cloneDeep from "lodash/cloneDeep";

import { listPublishedPages } from "webiny-api-cms/plugins/graphql/pageResolvers/listPublishedPages";

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
                        if (!context.parents) {
                            context.distinctParents = {
                                loaded: false,
                                data: {}
                            };
                        }

                        // "item.page" actually represents "parent" value. This is because once we have parent, we can
                        // more easily load the right child page (we just need to search published pages in this case).
                        if (Entity.isId(item.page) && !context.parents.data[item.page]) {
                            context.parents.data[item.page] = null;
                        }
                        break;
                    }
                }
            },
            async ({ context, item }) => {
                switch (item.type) {
                    case "cms-menu-item-page": {
                        if (!context.parents.loaded) {
                            const ids = Object.keys(context.parents.data);

                            const { Page, Category } = graphqlContext.cms.entities;
                            await listPublishedPages({
                                args: { parent: ids },
                                Page,
                                Category
                            }).then(results => {
                                for (let i = 0; i < results.length; i++) {
                                    let { title, url, parent: id } = results[i];
                                    context.parents.data[id] = { id, title, url };
                                }
                            });
                        }

                        const page = context.parents.data[item.page];
                        if (page) {
                            // First try to use the title set on the menu item. If none, use page title.
                            Object.assign(item, page, { title: item.title || page.title });
                        } else {
                            item.__cleanup__ = true;
                        }

                        break;
                    }
                    case "cms-menu-item-page-list": {
                        const { category, sortBy, sortDir } = item;

                        const { Page, Category } = graphqlContext.cms.entities;
                        item.children = await listPublishedPages({
                            args: { category, sort: { [sortBy]: parseInt(sortDir) } },
                            Page,
                            Category
                        });

                        item.children = await item.children.toJSON("id,title,url");

                        break;
                    }
                }
            }
        ]
    });

    return items;
};
