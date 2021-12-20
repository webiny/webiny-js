import { PbContext } from "@webiny/api-page-builder/types";
import { loadDataSources } from "./loadDataSources";
import { DynamicPage } from "~/types";

export const loadDynamicPage = async (args, context: PbContext) => {
    // Find all pages that have a pattern instead of an exact slug
    const [pages] = await context.pageBuilder.listPublishedPages<DynamicPage>({
        where: { dynamic: true },
        limit: 100
    });

    // Try matching the requested URL against dynamic page patterns
    try {
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            let pattern = page.path as any;
            const placeholders: string[] = Array.from(pattern.matchAll(/\{([a-zA-Z]+)\}/g));
            for (let j = 0; j < placeholders.length; j++) {
                const [find, replace] = placeholders[j];
                pattern = pattern.replace(find, `(?<${replace}>(.+))`);
            }
            // Try matching
            const match = args.path.match(new RegExp(pattern));
            if (match) {
                const fullPage = await context.pageBuilder.getPublishedPageById<DynamicPage>({
                    id: page.id
                });
                // Load data sources
                const dataSources = await loadDataSources(
                    fullPage.settings.dataSources,
                    { path: match.groups },
                    context
                );

                // We need to set the `id` to be unique to the matched parameters, not the `page` we loaded from DB
                fullPage.id = JSON.stringify(match.groups);
                fullPage.dataSources = dataSources;

                return fullPage;
            }
        }
    } catch (err) {
        console.log("Error loading dynamic page", err.message);
        throw err;
    }
};
