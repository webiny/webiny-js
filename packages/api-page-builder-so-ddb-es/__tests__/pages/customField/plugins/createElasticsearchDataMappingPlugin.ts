import { IndexPageDataPlugin } from "~/index";
import { CustomFieldsPage } from "~tests/types";

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
