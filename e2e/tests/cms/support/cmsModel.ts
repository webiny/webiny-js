import type { TestModelOptions } from "../../../support/contentModel.ts";

/**
 * The model the entries tests create through the API: a text field `title`, its title field, and a
 * number field `price`. No workflow is bound to it, so no review rule gets in the way of a publish.
 */
export const CMS_ENTRIES_MODEL: TestModelOptions = {
    area: "cms",
    label: "E2E CMS Item",
    apiName: "CmsItem",
    withPrice: true
};
