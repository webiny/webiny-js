import { createContextPlugin, Context } from "@webiny/api-serverless-cms";
import { WebinyError } from "@webiny/error";
import { PageDataIntegrityValidator } from "../../shared/PageDataIntegrityValidator";
import { PbPage } from "../../shared/types";

const validatePageDataIntegrityPlugin = async (ctx: Context, page: PbPage) => {
    // If the PB app is not yet installed, we don't need to validate the page data.
    const isInstalled = !!(await ctx.pageBuilder.getSystemVersion());
    if (!isInstalled) {
        return;
    }

    const result = PageDataIntegrityValidator.validate(page);
    if (!result.isValid) {
        throw new WebinyError(
            result.errorMessage,
            PageDataIntegrityValidator.PAGE_DATA_INTEGRITY_VALIDATION_ERROR,
            result.data
        );
    }
};

export const validatePageDataIntegrity = () => {
    return createContextPlugin(ctx => {
        // Run validation before updating or publishing a page.
        ctx.pageBuilder.onPageBeforeUpdate.subscribe(async ({ page }) => {
            if (!page) {
                return;
            }

            // Normally, when a page is created from a template, the page is linked with a template
            // in `page.content.data.template` property. Furthermore, page content is NOT editable unless
            // the page is unlinked from the template. Which, for Forth, is what we're doing immediately
            // after the page is created. This is because of the UX we want to achieve, and that is -
            // the moment a user creates a page from a template, we want to allow them to edit the page content.
            // We don't want them to first unlink the page from the template, and then edit the content.

            // Basically, the following code is here to ensure that the page content is immediately
            // unlinked from the template. The code works because, when a page is created from a template,
            // the page is first created and only then it's updated with the correct template content. That's
            // why we're doing this in a `beforeUpdate` event.
            // See https://github.com/webiny/webiny-js/blob/388e12f57938d4c3a9d4a6dbc201dbad09844ae2/packages/api-page-builder/src/graphql/crud/pageTemplates.crud.ts#L378
            const pageTemplateSlug = page.content?.data?.template?.slug;
            if (pageTemplateSlug) {
                const pageTemplate = await ctx.pageBuilder.getPageTemplate({
                    where: {
                        slug: pageTemplateSlug
                    }
                });

                if (pageTemplate) {
                    page.content = structuredClone(pageTemplate.content);
                    if (page.content!.data.template) {
                        delete page.content!.data.template;
                    }
                }
            } else {
                // @ts-ignore Incompatible types. Safe to ignore.
                await validatePageDataIntegrityPlugin(ctx, page as PbPage);
            }
        });

        ctx.pageBuilder.onPageBeforePublish.subscribe(async ({ page }) => {
            if (!page) {
                return;
            }

            // @ts-ignore Incompatible types. Safe to ignore.
            await validatePageDataIntegrityPlugin(ctx, page as PbPage);
        });

        // Run validation before updating or publishing a page template.
        ctx.pageBuilder.onPageTemplateBeforeUpdate.subscribe(async ({ pageTemplate }) => {
            if (!pageTemplate) {
                return;
            }

            // @ts-ignore Incompatible types. Safe to ignore.
            await validatePageDataIntegrityPlugin(ctx, pageTemplate as PbPage);
        });
    });
};
