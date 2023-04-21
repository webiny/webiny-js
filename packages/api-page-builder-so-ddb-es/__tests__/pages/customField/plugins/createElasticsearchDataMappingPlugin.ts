import { IndexPageDataPlugin } from "~/index";
import { CustomFieldsPage } from "~tests/types";

/**
 * This plugin will attach customViews to the Page Elasticsearch data.
 *
 * The value given in PageElasticsearchFieldPlugin.path must be equal to the path given here.
 */
export const createElasticsearchDataMappingPlugin = () => {
    return new IndexPageDataPlugin<CustomFieldsPage>(({ data, page }) => {
        if (page.settings?.customViews === undefined) {
            return;
        }
        data.settings = {
            ...(data.settings || {}),
            customViews: page.settings.customViews || 0
        };
    });
};
