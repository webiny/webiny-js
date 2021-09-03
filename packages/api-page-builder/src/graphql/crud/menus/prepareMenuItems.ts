import cloneDeep from "lodash/cloneDeep";
import { PbContext } from "../../types";
import { Menu } from "~/types";

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

        const { title, children, path, url, id, type } = items[i];
        items[i] = { title, path, url, children, id, type };

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
    context
}: {
    items?: Record<string, any>[];
    modifiers: Array<(args: { item: Record<string, any>; context: PbContext }) => void>;
    context: PbContext;
}) => {
    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        await applyModifier({ items, modifier, context });
    }

    // Cleanup empty items.
    await applyCleanup(items);
};

export default async ({ menu, context }: { menu: Menu; context: PbContext }) => {
    // TODO determine real type
    const items: any = cloneDeep(menu.items);
    // Each modifier is recursively applied to all items.
    await prepareItems({
        items,
        context,
        modifiers: [
            async ({ context, item }) => {
                if (item.type === "page") {
                    let page;
                    try {
                        page = await context.pageBuilder.pages.getPublishedById({
                            id: item.page
                        });
                    } catch {}

                    if (page) {
                        // First try to use the title set on the menu item. If none, use page title.
                        Object.assign(item, page, { title: item.title || page.title });
                    } else {
                        item.__cleanup__ = true;
                    }

                    return;
                }

                if (item.type === "pages-list") {
                    const { category, sortBy, sortDir, tags, tagsRule } = item;

                    const where = { category, tags: null };
                    if (tags) {
                        where.tags = { query: tags, rule: tagsRule || "all" };
                    }

                    const [children] = await context.pageBuilder.pages.listPublished({
                        limit: 200,
                        where,
                        sort: [`${sortBy}_${sortDir.toUpperCase()}`]
                    });

                    item.children = children.map(item => ({
                        path: item.path,
                        title: item.title,
                        id: item.id
                    }));
                }
            }
        ]
    });

    return items;
};
