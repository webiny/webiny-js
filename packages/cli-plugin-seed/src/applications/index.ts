import { createHeadlessCms } from "~/applications/createHeadlessCms";
import { createArticleEntryType } from "~/applications/headlessCms/entryTypes/article";
import { createAuthorEntryType } from "~/applications/headlessCms/entryTypes/author";
import { createCategoryEntryType } from "~/applications/headlessCms/entryTypes/category";

export const getDefaultPlugins = () => {
    return [
        createHeadlessCms(),
        createArticleEntryType(),
        createAuthorEntryType(),
        createCategoryEntryType()
    ];
};
