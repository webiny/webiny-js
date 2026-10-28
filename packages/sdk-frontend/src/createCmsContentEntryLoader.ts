import type { CmsClient } from "@webiny/cms-sdk";
import type { ContentEntryLoader } from "@webiny/website-builder-sdk";

/**
 * A content entry loader that reads through `cmsClient`, for a content client's
 * `contentEntryLoader` config. Pass a CMS client for the same tenant as the content client.
 */
export function createCmsContentEntryLoader(cmsClient: CmsClient): ContentEntryLoader {
    return {
        getEntry: params => cmsClient.getEntry(params),
        listEntries: params => cmsClient.listEntries(params)
    };
}
