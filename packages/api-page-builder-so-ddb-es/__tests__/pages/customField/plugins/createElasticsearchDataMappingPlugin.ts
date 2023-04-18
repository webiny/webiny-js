import { IndexPageDataPlugin } from "~/index";
import { CustomFieldsPage } from "~tests/types";
export const createElasticsearchDataMappingPlugin = () => {
    return new IndexPageDataPlugin<CustomFieldsPage>(({ data, input }) => {
        if (input.customViews === undefined) {
            return;
        }
        data.customViews = input.customViews || 0;
    });
};
