import cloneDeep from "lodash/cloneDeep";

import { listPublishedPages } from "../pageResolvers/listPublishedPages";

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
        const item = items[i];
        await modifier({ item, context });

        await applyModifier({ items: item.children, modifier, context });
    }
};

const prepareItems = async ({
    items,
    modifiers,
    context = {}
}: {
    items?: {[key: string]: any}[];
    modifiers: Function[];
    context?: {[key: string]: any};
}) => {
    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        await applyModifier({ items, modifier, context });
    }

    // Cleanup empty items.
    await applyCleanup(items);
};

export default async ({ menu, context }: {[key: string]: any}) => {
    const items = cloneDeep(menu.items);

    // Each modifier is recursively applied to all items.
    await prepareItems({
        items,
        modifiers: [
            ({ item, context }) => {
                switch (item.type) {
                    case "page": {
                        if (!context.distinctParents) {
                            context.distinctParents = {
                                loaded: false,
                                data: {}
                            };
                        }

                        // "item.page" actually represents "parent" value. This is because once we have parent, we can
                        // more easily load the right child page (we just need to search published pages in this case).
                        if (
                            context.commodo.isId(item.page) &&
                            !context.distinctParents.data[item.page]
                        ) {
                            context.distinctParents.data[item.page] = null;
                        }
                        break;
                    }
                }
            },
            async ({ context, item }) => {
                switch (item.type) {
                    case "page": {
                        if (!context.distinctParents.loaded) {
                            const ids = Object.keys(context.distinctParents.data);

                            await listPublishedPages({
                                args: { parent: ids },
                                context
                            }).then(results => {
                                for (let i = 0; i < results.length; i++) {
                                    const { title, url, parent: id } = results[i];
                                    context.distinctParents.data[id] = { id, title, url };
                                }
                            });
                        }

                        const page = context.distinctParents.data[item.page];
                        if (page) {
                            // First try to use the title set on the menu item. If none, use page title.
                            Object.assign(item, page, { title: item.title || page.title });
                        } else {
                            item.__cleanup__ = true;
                        }

                        break;
                    }
                    case "page-list": {
                        const { category, sortBy, sortDir } = item;

                        item.children = await listPublishedPages({
                            args: { category, sort: { [sortBy]: parseInt(sortDir) } },
                            context
                        });

                        item.children = await item.children.toJSON("id,title,url");

                        break;
                    }
                }
            }
        ],
        context
    });

    return items;
};
