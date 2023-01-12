import { PageBlockCreateInput, PbContext } from "~/graphql/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { BlockCategory } from "~/types";
import { oldCategories } from "./categoriesMap";

const categoriesCache: Record<string, BlockCategory> = {};

const getOrCreateCategory = async (slug: string, context: PbContext): Promise<BlockCategory> => {
    const { pageBuilder } = context;

    if (categoriesCache[slug]) {
        return categoriesCache[slug];
    }

    const category = await pageBuilder.getBlockCategory(slug);
    if (category) {
        return (categoriesCache[slug] = category);
    }

    // Maybe it's an old category
    const oldCategory = oldCategories.find(category => category.categoryName === slug);

    if (oldCategory) {
        const category = await pageBuilder.createBlockCategory({
            name: oldCategory.title,
            slug: oldCategory.categoryName,
            description: oldCategory.description,
            icon: "fas/box-archive"
        });

        return (categoriesCache[slug] = category);
    }

    // If we reached this part of code, we have a user-made category, so we'll just fall back to "general"
    return getOrCreateCategory("general", context);
};

export const migrateBlocks = async (tenant: Tenant, context: PbContext): Promise<void> => {
    const { pageBuilder, i18n } = context;

    /**
     * Find all locales for the current tenant, so we can find all pages for each locale.
     */
    const [locales] = await i18n.locales.storageOperations.list({
        where: {
            tenant: tenant.id
        },
        limit: 100
    });

    if (locales.length === 0) {
        console.log(`There are no locales under the tenant "${tenant.id}".`);
        return;
    }

    for (const locale of locales) {
        i18n.setContentLocale(locale);

        /**
         * Fetch all block elements for the current locale and create new blocks.
         */
        const elements = await pageBuilder.listPageElements();
        const blockElements = elements.filter(element => element.type === "block");

        for (const blockElement of blockElements) {
            const category: BlockCategory = await getOrCreateCategory(
                blockElement.category,
                context
            );

            const newBlock: PageBlockCreateInput = {
                name: blockElement.name,
                blockCategory: category.slug,
                content: blockElement.content,
                preview: blockElement.preview
            };

            await pageBuilder.createPageBlock(newBlock);
        }
    }
};
