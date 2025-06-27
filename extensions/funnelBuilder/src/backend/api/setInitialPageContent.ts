import { createContextPlugin } from "@webiny/api-serverless-cms";
import { createInitialPageContent } from "./createInitialPageContent";

export const setInitialPageContent = () => {
    return createContextPlugin(ctx => {
        ctx.pageBuilder.onPageBeforeCreate.subscribe(async ({ page }) => {
            // Ensure funnel builder is immediately added to the page content.
            page.content = createInitialPageContent();
        });

        ctx.pageBuilder.onPageTemplateBeforeCreate.subscribe(async ({ pageTemplate }) => {
            // Ensure funnel builder is immediately added to the template content.
            pageTemplate.content = createInitialPageContent();
        });
    });
};
