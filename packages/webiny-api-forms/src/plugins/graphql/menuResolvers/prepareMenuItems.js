// @flow
import { Entity } from "webiny-entity";
import cloneDeep from "lodash/cloneDeep";

import { listPublishedForms } from "webiny-api-forms/plugins/graphql/formResolvers/listPublishedForms";

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
                    case "forms-menu-item-form": {
                        if (!context.distinctParents) {
                            context.distinctParents = {
                                loaded: false,
                                data: {}
                            };
                        }

                        // "item.form" actually represents "parent" value. This is because once we have parent, we can
                        // more easily load the right child form (we just need to search published forms in this case).
                        if (Entity.isId(item.form) && !context.distinctParents.data[item.form]) {
                            context.distinctParents.data[item.form] = null;
                        }
                        break;
                    }
                }
            },
            async ({ context, item }) => {
                switch (item.type) {
                    case "forms-menu-item-form": {
                        if (!context.distinctParents.loaded) {
                            const ids = Object.keys(context.distinctParents.data);

                            const { Form, Category } = graphqlContext.forms.entities;
                            await listPublishedForms({
                                args: { parent: ids },
                                Form,
                                Category
                            }).then(results => {
                                for (let i = 0; i < results.length; i++) {
                                    let { title, url, parent: id } = results[i];
                                    context.distinctParents.data[id] = { id, title, url };
                                }
                            });
                        }

                        const form = context.distinctParents.data[item.form];
                        if (form) {
                            // First try to use the title set on the menu item. If none, use form title.
                            Object.assign(item, form, { title: item.title || form.title });
                        } else {
                            item.__cleanup__ = true;
                        }

                        break;
                    }
                    case "forms-menu-item-form-list": {
                        const { category, sortBy, sortDir } = item;

                        const { Form, Category } = graphqlContext.forms.entities;
                        item.children = await listPublishedForms({
                            args: { category, sort: { [sortBy]: parseInt(sortDir) } },
                            Form,
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
